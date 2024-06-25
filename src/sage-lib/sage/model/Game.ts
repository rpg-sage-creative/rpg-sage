import { DialogPostType, DicePostType, GameSystemType, SageChannelType, parseGameSystem, parseSageChannelType, updateGame, type DiceCritMethodType, type DiceOutputType, type DiceSecretMethodType, type GameOptions, type GameSystem, type SageChannel } from "@rsc-sage/types";
import { sortPrimitive, type Comparable } from "@rsc-utils/array-utils";
import { type IdCore } from "@rsc-utils/class-utils";
import { applyChanges, isDefined, warn, type Args, type Optional, type OrNull, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { DiscordKey, resolveUserId, type CanBeUserIdResolvable } from "@rsc-utils/discord-utils";
import type { GuildChannel, GuildMember, HexColorString, Message, Role } from "discord.js";
import type { EncounterCore } from "../commands/trackers/encounter/Encounter.js";
import { EncounterManager } from "../commands/trackers/encounter/EncounterManager.js";
import type { PartyCore } from "../commands/trackers/party/Party.js";
import { PartyManager } from "../commands/trackers/party/PartyManager.js";
import { HasIdCoreAndSageCache } from "../repo/base/IdRepository.js";
import { CharacterManager } from "./CharacterManager.js";
import type { CharacterShell } from "./CharacterShell.js";
import { Colors } from "./Colors.js";
import { Emoji } from "./Emoji.js";
import type { GameCharacter, GameCharacterCore } from "./GameCharacter.js";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore.js";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore.js";
import type { SageCache } from "./SageCache.js";
import type { Server } from "./Server.js";

export type TGameRoleType = keyof typeof GameRoleType;
export enum GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Cast = 4, Table = 5 }
export function getRoleTypes(roleType: GameRoleType): GameRoleType[] {
	switch (roleType) {
		// case GameRoleType.Table: return [];
		// case GameRoleType.Cast: return [];
		case GameRoleType.GameMaster: return [GameRoleType.GameMaster, GameRoleType.Cast, GameRoleType.Table];
		case GameRoleType.Player: return [GameRoleType.Player, GameRoleType.Cast, GameRoleType.Table];
		case GameRoleType.Spectator: return [GameRoleType.Spectator, GameRoleType.Table];
		default: return [];
	}
}
export interface IGameRole {
	did: Snowflake;
	type: GameRoleType;
	dicePing: boolean;
}

export enum GameUserType { Unknown = 0, Player = 1, GameMaster = 2 }
export interface IGameUser { did: Snowflake; type: GameUserType; dicePing: boolean; }

export interface GameCore extends IdCore, IHasColors, IHasEmoji, Partial<GameOptions> {
	objectType: "Game";
	createdTs: number;
	archivedTs?: number;

	name: string;

	serverId: UUID;
	serverDid: Snowflake;

	channels: SageChannel[];
	roles?: IGameRole[];

	users?: IGameUser[];

	nonPlayerCharacters?: (GameCharacter | GameCharacterCore)[];
	playerCharacters?: (GameCharacter | GameCharacterCore)[];

	parties?: PartyCore[] | PartyManager;
	encounters?: EncounterCore[] | EncounterManager;
}

export type TMappedChannelNameTags = {
	ic: boolean;
	ooc: boolean;
	gm: boolean;
	dice: boolean;
	misc: boolean;
};
export type TMappedGameChannel = {
	id: Snowflake;
	sChannel: SageChannel;
	gChannel: GuildChannel | undefined;
	nameTags: TMappedChannelNameTags;
};

function sageChannelTypeToNameTags(channelType?: SageChannelType): TMappedChannelNameTags {
	const gm = channelType === SageChannelType.GameMaster;
	const ooc = channelType === SageChannelType.OutOfCharacter;
	const ic = channelType === SageChannelType.InCharacter;
	const dice = channelType === SageChannelType.Dice;
	const misc = !gm && !ooc && !ic && !dice;

	return { ic, gm, ooc, dice, misc };
}

/** Reads IChannel properties to determine channel type: IC, GM, OOC, MISC */
export function mapSageChannelNameTags(channel: SageChannel): TMappedChannelNameTags {
	return sageChannelTypeToNameTags(channel.type);
}
export function nameTagsToType(nameTags: TMappedChannelNameTags): string {
	if (nameTags.gm) {
		return "GM <i>(Game Master)</i>";
	}
	if (nameTags.ic) {
		return "IC <i>(In Character)</i>";
	}
	if (nameTags.ooc) {
		return "OOC <i>(Out of Character)</i>";
	}
	if (nameTags.dice) {
		return "Dice";
	}
	if (nameTags.misc) {
		return "Misc";
	}
	return "<i>None</i>";
}

/** Reads GuildChannel.name to determine channel type: IC, GM, OOC, MISC */
function mapGuildChannelNameTags(channel: GuildChannel): TMappedChannelNameTags {
	return sageChannelTypeToNameTags(parseSageChannelType(channel.name));
}

/** Returns [guildChannels.concat(sageChannels), guildChannels, sageChannels] */
async function mapChannels(channels: SageChannel[], sageCache: SageCache): Promise<[TMappedGameChannel[], TMappedGameChannel[], TMappedGameChannel[]]> {
	const sChannels: TMappedGameChannel[] = [];
	const gChannels: TMappedGameChannel[] = [];
	for (const sChannel of channels) {
		sChannels.push({
			id: sChannel.id as Snowflake,
			sChannel: sChannel,
			gChannel: undefined,
			nameTags: mapSageChannelNameTags(sChannel)
		});

		const gChannel = await sageCache.discord.fetchChannel(sChannel.id) as GuildChannel;
		if (gChannel) {
			gChannels.push({
				id: sChannel.id as Snowflake,
				sChannel: sChannel,
				gChannel: gChannel,
				nameTags: mapGuildChannelNameTags(gChannel)
			});
		}
	}
	return [gChannels.concat(sChannels), gChannels, sChannels];
}

/** Cleans up the users from the time we weren't correctly validating duplicate users when adding them. */
function fixDupeUsers(game: GameCore): void {
	// 0 = unkonwn, 1 = player, 2 = gm
	const sets = [new Set<string>(), new Set<string>(), new Set<string>()];

	const users = game.users ?? [];
	users?.forEach(user => sets[user.type ?? 0].add(user.did));

	const filtered: IGameUser[] = [];
	while (sets.length) {
		// do them in priority order: gm, player, other
		const set = sets.pop()!;
		// we just popped the set, so length is the user type
		const type = sets.length;
		for (const did of set) {
			const found = users.find(user => user.did === did && user.type === type);
			if (found && !filtered.find(user => user.did === did)) {
				filtered.push(found);
			}
		}
	}
	game.users = filtered;
}

export class Game extends HasIdCoreAndSageCache<GameCore> implements Comparable<Game>, IHasColorsCore, IHasEmojiCore {
	public constructor(core: GameCore, public server: Server, sageCache: SageCache) {
		super(updateGame(core), sageCache);
		fixDupeUsers(core);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");
		this.core.encounters = EncounterManager.from(this.core.encounters as EncounterCore[] ?? (this.core.encounters = []), this);
		this.core.parties = PartyManager.from(this.core.parties as PartyCore[] ?? (this.core.parties = []), this);
	}

	public get createdDate(): Date { return new Date(this.core.createdTs ?? 283305600000); }
	public get archivedDate(): Date | undefined { return this.core.archivedTs ? new Date(this.core.archivedTs) : undefined; }
	public get isArchived(): boolean { return this.core.createdTs && this.core.archivedTs ? this.core.createdTs < this.core.archivedTs : false; }

	public get name(): string { return this.core.name; }
	private _gameSystem?: GameSystem | null;
	public get gameSystem(): GameSystem | undefined { return this._gameSystem === null ? undefined : (this._gameSystem = parseGameSystem(this.core.gameSystemType) ?? null) ?? undefined; }
	public get gameSystemType(): GameSystemType | undefined { return this.core.gameSystemType; }
	/** @deprecated use .gameSystemType */
	public get gameType(): GameSystemType | undefined { return this.core.gameSystemType; }
	public get dialogPostType(): DialogPostType | undefined { return this.core.dialogPostType; }
	public get diceCritMethodType(): DiceCritMethodType | undefined { return this.core.diceCritMethodType; }
	public get diceOutputType(): DiceOutputType | undefined { return this.core.diceOutputType; }
	public get dicePostType(): DicePostType | undefined { return this.core.dicePostType; }
	public get diceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.diceSecretMethodType; }
	public get serverDid(): Snowflake { return this.core.serverDid; }
	public get serverId(): UUID { return this.core.serverId; }
	private get discord() { return this.sageCache.discord; }

	public get gmRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.GameMaster); }
	public get gmRoleDid(): Snowflake | undefined { return this.gmRole?.did; }

	public get playerRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.Player); }
	public get playerRoleDid(): Snowflake | undefined { return this.playerRole?.did; }
	/** Returns users assigned manually, NOT users assigned via Player role. */
	private get players(): Snowflake[] { return this.users.filter(user => user.type === GameUserType.Player).map(user => user.did); }

	public get channels(): SageChannel[] { return this.core.channels ?? (this.core.channels = []); }
	public get gameMasters(): Snowflake[] { return this.users.filter(user => user.type === GameUserType.GameMaster).map(user => user.did); }
	public get gmCharacterName(): string { return this.core.gmCharacterName ?? this.server.gmCharacterName; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }
	public get orphanedPlayerCharacters() { return this.playerCharacters.filter(pc => !pc.userDid || !this.players.includes(pc.userDid)); }
	public findCharacterOrCompanion(name: string): GameCharacter | CharacterShell | undefined {
		return this.playerCharacters.findByName(name)
			?? this.playerCharacters.findCompanionByName(name)
			?? this.nonPlayerCharacters.findByName(name)
			?? this.nonPlayerCharacters.findCompanionByName(name)
			?? this.encounters.findCharacter(name)
			?? this.parties.findCharacter(name);
	}
	public get roles(): IGameRole[] { return this.core.roles ?? (this.core.roles = []); }
	public get users(): IGameUser[] { return this.core.users ?? (this.core.users = []); }

	public get encounters(): EncounterManager { return this.core.encounters as EncounterManager; }
	public get parties(): PartyManager { return this.core.parties as PartyManager; }

	//#region Guild fetches
	public async findBestPlayerChannel(): Promise<SageChannel | undefined> {
		const [allChannels, gChannels, sChannels] = await mapChannels(this.channels, this.sageCache);
		return (
				allChannels.find(channel => channel.nameTags.ic)
				?? allChannels.find(channel => channel.nameTags.ooc)
				?? sChannels.find(channel => !channel.nameTags.gm)
				?? gChannels.find(channel => !channel.nameTags.gm)
			)?.sChannel;
	}
	public async findBestGameMasterChannel(): Promise<SageChannel> {
		const [allChannels] = await mapChannels(this.channels, this.sageCache);
		return (
				allChannels.find(channel => channel.nameTags.gm)
				?? allChannels.find(channel => channel.nameTags.ic)
				?? allChannels[0]
			)?.sChannel;
	}
	public async gmGuildChannel(): Promise<OrNull<GuildChannel>> {
		for (const sChannel of this.channels) {
			if (sChannel.type === SageChannelType.GameMaster) {
				const gChannel = await this.discord.fetchChannel(sChannel.id);
				if (gChannel) {
					return gChannel as GuildChannel;
				}
			}
		}
		return null;
	}

	/** Returns all players (manual and role) as GuildMember objects. */
	public async pGuildMembers(): Promise<GuildMember[]> {
		const pGuildMembers = await Promise.all(this.players.map(player => this.discord.fetchGuildMember(player)));
		const pRoleDid = this.playerRoleDid;
		if (pRoleDid) {
			const discordRole = await this.discord.fetchGuildRole(pRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !pGuildMembers.some(p => p?.id === guildMember.id));
				pGuildMembers.push(...roleOnly.values());
			}
		}
		return pGuildMembers.filter(isDefined);
	}
	public async guildChannels(): Promise<GuildChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.discord.fetchChannel(channel.id)));
		return all.filter(isDefined) as GuildChannel[];
	}
	public async orphanChannels(): Promise<SageChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.discord.fetchChannel(channel.id)));
		return this.channels.filter((_, index) => !all[index]);
	}
	public async orphanUsers(): Promise<IGameUser[]> {
		const all = await Promise.all(this.users.map(user => this.discord.fetchGuildMember(user.did)));
		return this.users.filter((_, index) => !all[index]);
	}
	public async gmGuildMembers(): Promise<GuildMember[]> {
		const gmGuildMembers = await Promise.all(this.gameMasters.map(gameMaster => this.discord.fetchGuildMember(gameMaster)));
		const gmRoleDid = this.gmRoleDid;
		if (gmRoleDid) {
			const discordRole = await this.discord.fetchGuildRole(gmRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !gmGuildMembers.some(gm => gm?.id === guildMember.id));
				gmGuildMembers.push(...roleOnly.values());
			}
		}
		return gmGuildMembers.filter(isDefined);
	}
	public async gmGuildMember(): Promise<GuildMember | undefined> {
		const gmGuildMembers = await this.gmGuildMembers();
		if (gmGuildMembers.length > 1) {
			for (const guildMember of gmGuildMembers) {
				if ("online" === guildMember.presence?.status) {
					return guildMember;
				}
			}
		}
		return gmGuildMembers[0];
	}
	public async guildRoles(): Promise<Role[]> {
		const all = await Promise.all(this.roles.map(role => this.discord.fetchGuildRole(role.did)));
		return all.filter(isDefined);
	}
	//#endregion

	// #region Channel actions

	public async addOrUpdateChannels(...channels: Args<SageChannel>[]): Promise<boolean> {
		channels.forEach(channel => {
			const found = this.getChannel(new DiscordKey(this.serverDid, channel.id));
			if (found) {
				applyChanges(found, channel);
			} else {
				const newChannel = { } as SageChannel;
				applyChanges(newChannel, channel);
				(this.core.channels || (this.core.channels = [])).push(newChannel);
			}
		});
		return this.save();
	}

	public async removeChannels(...channelDids: Snowflake[]): Promise<boolean> {
		const count = (this.core.channels || []).length;
		if (!count) {
			return false;
		}
		channelDids.forEach(channelDid => {
			this.core.channels = this.core.channels.filter(_channel => _channel.id !== channelDid);
		});
		return this.core.channels.length !== count ? this.save() : false;
	}
	// #endregion

	// #region Role actions
	public async addRole(roleType: GameRoleType, roleDid: Snowflake): Promise<boolean> {
		const found = this.getRole(roleType);
		if (found) {
			return false;
		}
		const role = { did: roleDid, type: roleType, dicePing: true };
		(this.core.roles ?? (this.core.roles = [])).push(role);
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const userDids = this.getUsersByRole(role.type);
		// 	await Roles.addRoleToUser(this.sageCache, role.did, userDids);
		// }
		// return saved;
		*/
		return this.save();
	}
	public async updateRole(roleType: GameRoleType, roleDid: Snowflake): Promise<boolean> {
		const role = this.getRole(roleType);
		if (!role || role.did === roleDid) {
			return false;
		}
		/*
		// const oldRole = { type:role.type, did:role.did };
		*/
		role.did = roleDid;
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const userDids = this.getUsersByRole(oldRole.type);
		// 	await Roles.updateRoleForUser(this.sageCache, oldRole.did, role.did, userDids);
		// }
		// return saved;
		*/
		return this.save();
	}
	public async removeRole(roleType: GameRoleType): Promise<boolean> {
		const role = this.getRole(roleType);
		if (!role) {
			return false;
		}
		this.core.roles = this.core.roles!.filter(_role => _role !== role);
		/** @todo this will likely orphan pcs and npcs, which we are removing linkage to in the functions below ... */
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const userDids = this.getUsersByRole(role.type);
		// 	await Roles.removeRoleFromUser(this.sageCache, role.did, userDids);
		// }
		// return saved;
		*/
		return this.save();
	}
	// #endregion

	// #region GameMaster actions
	public async addGameMasters(userDids: Snowflake[]): Promise<boolean> {
		const filtered: Snowflake[] = [];
		for (const userDid of userDids) {
			const user = this.getUser(userDid);
			if (user) {
				if (user.type !== GameUserType.GameMaster) {
					await this.removePlayers([userDid]);
					filtered.push(userDid);
				}
			} else {
				filtered.push(userDid);
			}
		}
		if (!filtered.length) {
			return false;
		}

		const gameMasters = filtered.map(userDid => ({ did: userDid, type: GameUserType.GameMaster, dicePing:true }));
		(this.core.users ?? (this.core.users = [])).push(...gameMasters);
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const roleTypes = getRoleTypes(GameRoleType.GameMaster);
		// 	const roleDids = this.roles.filter(role => roleTypes.includes(role.type)).map(role => role.did);
		// 	if (roleDids.length) {
		// 		await Roles.addRoleToUser(this.sageCache, roleDids, userDids);
		// 	}
		// }
		// return saved;
		*/
		return this.save();
	}
	public async removeGameMasters(userDids: Snowflake[]): Promise<boolean> {
		const filtered = userDids.filter(userDid => this.hasGameMaster(userDid));
		if (!filtered.length) {
			return false;
		}

		// unlink npcs from ex-GMs
		this.nonPlayerCharacters.forEach(char => {
			if (filtered.includes(char.userDid!)) {
				delete char.userDid;
			}
		});

		this.core.users = this.core.users!.filter(user => user.type !== GameUserType.GameMaster || !filtered.includes(user.did));
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const roleDids = this.roles.map(role => role.did);
		// 	if (roleDids.length) {
		// 		await Roles.removeRoleFromUser(this.sageCache, roleDids, filtered);
		// 	}
		// }
		// return saved;
		*/
		return this.save();
	}
	// #endregion GameMaster actions

	// #region Player actions
	public async addPlayers(userDids: Snowflake[]): Promise<boolean> {
		const filtered: Snowflake[] = [];
		for (const userDid of userDids) {
			const user = this.getUser(userDid);
			if (user) {
				if (user.type !== GameUserType.Player) {
					await this.removeGameMasters([userDid]);
					filtered.push(userDid);
				}
			} else {
				filtered.push(userDid);
			}
		}
		if (!filtered.length) {
			return false;
		}

		const players = filtered.map(userDid => (<IGameUser>{ did: userDid, type: GameUserType.Player }));
		(this.core.users ?? (this.core.users = [])).push(...players);
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const roleTypes = getRoleTypes(GameRoleType.Player);
		// 	const roleDids = this.roles.filter(role => roleTypes.includes(role.type)).map(role => role.did);
		// 	if (roleDids.length) {
		// 		await Roles.addRoleToUser(this.sageCache, roleDids, userDids);
		// 	}
		// }
		// return saved;
		*/
		return this.save();
	}
	public async removePlayers(userDids: Snowflake[]): Promise<boolean> {
		const filtered = userDids.filter(userDid => this.hasPlayer(userDid));
		if (!filtered.length) {
			return false;
		}

		// unlink pcs from ex-Players
		this.playerCharacters.forEach(char => {
			if (filtered.includes(char.userDid!)) {
				delete char.userDid;
			}
		});

		this.core.users = this.core.users!.filter(user => user.type !== GameUserType.Player || !filtered.includes(user.did));
		/*
		// const saved = await this.save();
		// if (saved) {
		// 	const roleDids = this.roles.map(role => role.did);
		// 	if (roleDids.length) {
		// 		await Roles.removeRoleFromUser(this.sageCache, roleDids, filtered);
		// 	}
		// }
		// return saved;
		*/
		return this.save();
	}
	// #endregion PC actions

	public getAutoCharacterForChannel(userDid: Snowflake, ...channelDids: Optional<Snowflake>[]): GameCharacter | undefined {
		for (const channelDid of channelDids) {
			if (channelDid) {
				const autoChannelData = { channelDid, userDid };
				return this.playerCharacters.getAutoCharacter(autoChannelData)
					?? this.nonPlayerCharacters.getAutoCharacter(autoChannelData)
					?? undefined;
			}
		}
		return undefined;
	}

	// private updateName(name: Optional<string>): void { this.core.name = name ?? this.core.name ?? ""; }
	public async update(changes: Args<GameOptions>): Promise<boolean> {
		const { name, ...otherChanges } = changes;
		const oldName = this.core.name;
		this.core.name = name ?? this.core.name ?? "";
		const changed = applyChanges(this.core as GameOptions, otherChanges);
		if (changed || oldName !== this.core.name) {
			return this.save();
		}
		return false;
	}

	public async updateDicePing(userOrRoleDid: Snowflake, dicePing: boolean): Promise<boolean> {
		const gameUser = this.getUser(userOrRoleDid);
		if (gameUser) {
			if (gameUser.dicePing !== dicePing) {
				gameUser.dicePing = dicePing;
				return this.save();
			}
			return false;
		}
		const gameRole = this.roles.find(role => role.did === userOrRoleDid);
		if (gameRole && gameRole.dicePing !== dicePing) {
			gameRole.dicePing = dicePing;
			return this.save();
		}
		return false;
	}

	public async archive(): Promise<boolean> {
		this.core.archivedTs = new Date().getTime();
		return this.save();
	}

	// #region Get

	public getChannel(discordKey: DiscordKey): SageChannel | undefined;
	public getChannel(channelDid: Optional<Snowflake>): SageChannel | undefined;
	public getChannel(didOrKey: Optional<Snowflake> | DiscordKey): SageChannel | undefined {
		if (didOrKey) {
			if (typeof(didOrKey) === "string") {
				return this.channels.find(channel => channel.id === didOrKey);
			}
			const channelAndThread = didOrKey.channelAndThread;
			if (channelAndThread.thread && channelAndThread.channel) {
				return this.channels.find(channel => channel.id === channelAndThread.thread)
					?? this.channels.find(channel => channel.id === channelAndThread.channel);
			}else if (channelAndThread.thread) {
				return this.channels.find(channel => channel.id === channelAndThread.thread);
			}else if (channelAndThread.channel) {
				return this.channels.find(channel => channel.id === channelAndThread.channel);
			}
		}
		return undefined;
	}

	public getRole(roleType: GameRoleType): IGameRole | undefined {
		return this.roles.find(role => role.type === roleType);
	}

	public getUser(userResolvable: Optional<CanBeUserIdResolvable>): IGameUser | undefined {
		const userId = resolveUserId(userResolvable);
		return this.users.find(user => user.did === userId);
	}

	// #endregion

	// #region Has

	public hasChannel(discordKey: DiscordKey): boolean;
	public hasChannel(channelDid: Optional<Snowflake>): boolean;
	public hasChannel(didOrKey: Optional<Snowflake> | DiscordKey): boolean {
		return this.getChannel(didOrKey as DiscordKey) !== undefined;
	}

	public hasGameMaster(userResolvable: Optional<CanBeUserIdResolvable>): boolean {
		return this.getUser(userResolvable)?.type === GameUserType.GameMaster;
	}

	public hasPlayer(userResolvable: Optional<CanBeUserIdResolvable>): boolean {
		return this.getUser(userResolvable)?.type === GameUserType.Player;
	}

	/** Returns true if the game has the given User. */
	public async hasUser(userResolvable: Optional<CanBeUserIdResolvable>): Promise<boolean>;
	/** Returns true if the game has the given User for the given RoleType. */
	public async hasUser(userResolvable: Optional<CanBeUserIdResolvable>, roleType: GameRoleType): Promise<boolean>;
	public async hasUser(userResolvable: Optional<CanBeUserIdResolvable>, roleType?: GameRoleType): Promise<boolean> {
		const userId = resolveUserId(userResolvable);
		if (!userId) {
			return false;
		}
		if (roleType === undefined) {
			if (this.getUser(userId) !== undefined) {
				return true;
			}
			for (const role of this.roles) {
				const bool = await hasRole(this.sageCache, userId, role.did);
				if (bool) {
					return true;
				}
			}
			return false;
		}
		const userType = GameUserType[GameRoleType[roleType] as keyof typeof GameUserType];
		if (userType !== undefined && this.getUser(userId)?.type === userType) {
			return true;
		}
		const roleDid = this.getRole(roleType)?.did;
		if (roleDid) {
			return hasRole(this.sageCache, userId, roleDid);
		}
		return false;

		async function hasRole(sageCache: SageCache, _userDid: Snowflake, _roleDid: Snowflake): Promise<boolean> {
			const guildMember = await sageCache.discord.fetchGuildMember(_userDid);
			const roleDids = Array.from(guildMember?.roles.cache.values() ?? []).map(role => role.id);
			return roleDids.includes(_roleDid);
		}
	}

	// #endregion

	public async save(): Promise<boolean> {
		return this.sageCache.games.write(this);
	}

	// #region IComparable
	public compareTo(other: Game): -1 | 0 | 1 {
		return sortPrimitive(this.name, other.name);
	}
	// #endregion

	// #region IHasColorsCore

	private _colors?: Colors;

	public get colors(): Colors {
		if (!this._colors) {
			this._colors = new Colors(this.core.colors ?? (this.core.colors = []));
		}
		return this._colors;
	}

	public toHexColorString(colorType: ColorType): HexColorString | undefined {
		if (!this.core.colors.length) {
			warn(`Colors Missing: Game (${this.name || this.id})`);
			return this.server.toHexColorString(colorType);
		}
		return this.colors.toHexColorString(colorType)
			?? this.server.toHexColorString(colorType);
	}

	// #endregion

	// #region IHasEmoji

	private _emoji?: Emoji;

	public get emoji(): Emoji {
		if (!this._emoji) {
			this._emoji = new Emoji(this.core.emoji ?? (this.core.emoji = []));
		}
		return this._emoji;
	}

	public emojify(text: string): string {
		return this.server.emojify(this.emoji.emojify(text));
	}

	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType)
			?? this.server.getEmoji(emojiType);
	}

	// #endregion

	public static async from(message: Message, sageCache: SageCache): Promise<Game | null> {
		if (message.guild) {
			const game = await sageCache.games.findByDiscordKey(DiscordKey.from(message));
			if (game) {
				return game;
			}
		}
		return null;
	}
}
