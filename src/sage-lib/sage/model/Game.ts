import type * as Discord from "discord.js";
import type { GameType } from "../../../sage-common";
import type { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import utils, { IComparable, Optional, OrNull, UUID } from "../../../sage-utils";
import { IdCore } from "../../../sage-utils/utils/ClassUtils";
import { warn } from "../../../sage-utils/utils/ConsoleUtils";
import { DiscordKey } from "../../discord";
import type { DicePostType } from "../commands/dice";
import type { EncounterCore } from "../commands/trackers/encounter/Encounter";
import { EncounterManager } from "../commands/trackers/encounter/EncounterManager";
import type { PartyCore } from "../commands/trackers/party/Party";
import { PartyManager } from "../commands/trackers/party/PartyManager";
import type { DialogType, IChannel } from "../repo/base/IdRepository";
import { HasIdCoreAndSageCache, PermissionType, updateChannel } from "../repo/base/IdRepository";
import CharacterManager from "./CharacterManager";
import type { CharacterShell } from "./CharacterShell";
import Colors from "./Colors";
import Emoji from "./Emoji";
import type GameCharacter from "./GameCharacter";
import type { GameCharacterCore } from "./GameCharacter";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore";
import type SageCache from "./SageCache";
import type Server from "./Server";

const exists = utils.ArrayUtils.Filters.exists;

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
	did: Discord.Snowflake;
	type: GameRoleType;
	dicePing: boolean;
}

export enum GameUserType { Unknown = 0, Player = 1, GameMaster = 2 }
export interface IGameUser { did: Discord.Snowflake; type: GameUserType; dicePing: boolean; }

export interface IGameCore extends IdCore, IHasColors, IHasEmoji {
	objectType: "Game";
	createdTs: number;
	archivedTs?: number;

	name: string;
	gameType?: GameType;

	defaultDialogType?: DialogType;
	defaultCritMethodType?: CritMethodType;
	defaultDiceOutputType?: DiceOutputType;
	defaultDicePostType?: DicePostType;
	defaultDiceSecretMethodType?: DiceSecretMethodType;

	serverId: UUID;
	serverDid: Discord.Snowflake;

	channels: IChannel[];
	roles?: IGameRole[];

	users?: IGameUser[];

	nonPlayerCharacters?: (GameCharacter | GameCharacterCore)[];
	playerCharacters?: (GameCharacter | GameCharacterCore)[];
	gmCharacterName?: string;

	parties?: PartyCore[] | PartyManager;
	encounters?: EncounterCore[] | EncounterManager;
}

export type TMappedChannelNameTags = {
	ic: boolean;
	ooc: boolean;
	gm: boolean;
	misc: boolean;
};
export type TMappedGameChannel = {
	did: Discord.Snowflake;
	sChannel: IChannel;
	gChannel: Discord.GuildChannel | undefined;
	nameTags: TMappedChannelNameTags;
};

/** Reads IChannel properties to determine channel type: IC, GM, OOC, MISC */
export function mapSageChannelNameTags(channel: IChannel): TMappedChannelNameTags {
	const gmWrite = channel.gameMaster === PermissionType.Write;
	const pcWrite = channel.player === PermissionType.Write;
	const bothWrite = gmWrite && pcWrite;

	const dialog = channel.dialog === true;
	const commands = channel.commands === true;
	const search = channel.search === true;

	const gm = gmWrite && !pcWrite;
	const ooc = bothWrite && (!dialog || commands || search);
	const ic = bothWrite && !ooc && dialog;
	const misc = !ic && !ooc && !gm;

	return { ic, gm, ooc, misc };
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
	if (nameTags.misc) {
		return "Misc";
	}
	return "<i>None</i>";
}

/** Reads GuildChannel.name to determine channel type: IC, GM, OOC, MISC */
function mapGuildChannelNameTags(channel: Discord.GuildChannel): TMappedChannelNameTags {
	const ic = channel.name.match(/\bic\b/i) !== null;
	const gm = !ic && channel.name.match(/\bgms?\b/i) !== null;
	const ooc = !ic && !gm && channel.name.match(/\booc\b/i) !== null;
	const misc = !ic && !ooc && !gm;
	return { ic, ooc, gm, misc };
}

/** Returns [guildChannels.concat(sageChannels), guildChannels, sageChannels] */
async function mapChannels(channels: IChannel[], sageCache: SageCache): Promise<[TMappedGameChannel[], TMappedGameChannel[], TMappedGameChannel[]]> {
	const sChannels: TMappedGameChannel[] = [];
	const gChannels: TMappedGameChannel[] = [];
	for (const sChannel of channels) {
		sChannels.push({
			did: sChannel.did,
			sChannel: sChannel,
			gChannel: undefined,
			nameTags: mapSageChannelNameTags(sChannel)
		});

		const gChannel = await sageCache.discord.fetchChannel(sChannel.did) as Discord.GuildChannel;
		if (gChannel) {
			gChannels.push({
				did: sChannel.did,
				sChannel: sChannel,
				gChannel: gChannel,
				nameTags: mapGuildChannelNameTags(gChannel)
			});
		}
	}
	return [gChannels.concat(sChannels), gChannels, sChannels];
}

export default class Game extends HasIdCoreAndSageCache<IGameCore> implements IComparable<Game>, IHasColorsCore, IHasEmojiCore {
	public constructor(core: IGameCore, public server: Server, sageCache: SageCache) {
		super(core, sageCache);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");
		this.core.encounters = EncounterManager.from(this.core.encounters as EncounterCore[] ?? (this.core.encounters = []), this);
		this.core.parties = PartyManager.from(this.core.parties as PartyCore[] ?? (this.core.parties = []), this);
	}

	public get createdDate(): Date { return new Date(this.core.createdTs ?? 283305600000); }
	public get archivedDate(): Date | undefined { return this.core.archivedTs ? new Date(this.core.archivedTs) : undefined; }
	public get isArchived(): boolean { return this.core.createdTs && this.core.archivedTs ? this.core.createdTs < this.core.archivedTs : false; }

	public get name(): string { return this.core.name; }
	public get gameType(): GameType | undefined { return this.core.gameType; }
	public get defaultCritMethodType(): CritMethodType | undefined { return this.core.defaultCritMethodType; }
	public get defaultDialogType(): DialogType | undefined { return this.core.defaultDialogType; }
	public get defaultDiceOutputType(): DiceOutputType | undefined { return this.core.defaultDiceOutputType; }
	public get defaultDicePostType(): DicePostType | undefined { return this.core.defaultDicePostType; }
	public get defaultDiceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.defaultDiceSecretMethodType; }
	public get serverDid(): Discord.Snowflake { return this.core.serverDid; }
	public get serverId(): UUID { return this.core.serverId; }
	private get discord() { return this.sageCache.discord; }

	public get gmRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.GameMaster); }
	public get gmRoleDid(): Discord.Snowflake | undefined { return this.gmRole?.did; }

	public get playerRole(): IGameRole | undefined { return this.roles.find(role => role.type === GameRoleType.Player); }
	public get playerRoleDid(): Discord.Snowflake | undefined { return this.playerRole?.did; }
	public get players(): Discord.Snowflake[] { return this.users.filter(user => user.type === GameUserType.Player).map(user => user.did); }

	public get channels(): IChannel[] { return this.core.channels ?? (this.core.channels = []); }
	public get gameMasters(): Discord.Snowflake[] { return this.users.filter(user => user.type === GameUserType.GameMaster).map(user => user.did); }
	public get gmCharacterName(): string { return this.core.gmCharacterName ?? this.server.defaultGmCharacterName; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }
	public get orphanedPlayerCharacters() { return this.playerCharacters.filter(pc => !pc.userDid || !this.players.includes(pc.userDid)); }
	public findCharacterOrCompanion(name: string): GameCharacter | CharacterShell | undefined {
		return this.playerCharacters.findByName(name)
			?? this.playerCharacters.findCompanionByName(name)
			?? this.nonPlayerCharacters.findByName(name)
			?? this.nonPlayerCharacters.findCompanionByName(name)
			?? this.orphanedPlayerCharacters.findByName(name)
			?? this.orphanedPlayerCharacters.findCompanionByName(name)
			?? this.encounters.findCharacter(name)
			?? this.parties.findCharacter(name);
	}
	public get roles(): IGameRole[] { return this.core.roles ?? (this.core.roles = []); }
	public get users(): IGameUser[] { return this.core.users ?? (this.core.users = []); }

	public get encounters(): EncounterManager { return this.core.encounters as EncounterManager; }
	public get parties(): PartyManager { return this.core.parties as PartyManager; }

	//#region Guild fetches
	public async findBestPlayerChannel(): Promise<IChannel | undefined> {
		const [allChannels, gChannels, sChannels] = await mapChannels(this.channels, this.sageCache);
		return (
				allChannels.find(channel => channel.nameTags.ic)
				?? allChannels.find(channel => channel.nameTags.ooc)
				?? sChannels.find(channel => !channel.nameTags.gm)
				?? gChannels.find(channel => !channel.nameTags.gm)
			)?.sChannel;
	}
	public async findBestGameMasterChannel(): Promise<IChannel> {
		const [allChannels] = await mapChannels(this.channels, this.sageCache);
		return (
				allChannels.find(channel => channel.nameTags.gm)
				?? allChannels.find(channel => channel.nameTags.ic)
				?? allChannels[0]
			)?.sChannel;
	}
	public async gmGuildChannel(): Promise<OrNull<Discord.GuildChannel>> {
		for (const sChannel of this.channels) {
			if (sChannel.gameMaster === PermissionType.Write && !sChannel.player) {
				const gChannel = await this.discord.fetchChannel(sChannel.did);
				if (gChannel) {
					return gChannel as Discord.GuildChannel;
				}
			}
		}
		return null;
	}
	public async pGuildMembers(): Promise<Discord.GuildMember[]> {
		// TODO: investiage iterating over guild.memebers as "cleaner"
		// return Promise.all(this.players.map(player => this.discord.fetchGuildMember(player)));

		const pGuildMembers = (await Promise.all(this.players.map(player => this.discord.fetchGuildMember(player))))
			.filter(exists);
		const pRoleDid = this.playerRoleDid;
		if (pRoleDid) {
			const discordRole = await this.discord.fetchGuildRole(pRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !pGuildMembers.find(p => p.id === guildMember.id));
				pGuildMembers.push(...roleOnly.values());
			}
		}
		return pGuildMembers;
	}
	public async guildChannels(): Promise<Discord.GuildChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.discord.fetchChannel(channel.did)));
		return all.filter(exists) as Discord.GuildChannel[];
	}
	public async orphanChannels(): Promise<IChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.discord.fetchChannel(channel.did)));
		return this.channels.filter((_, index) => !all[index]);
	}
	public async orphanUsers(): Promise<IGameUser[]> {
		const all = await Promise.all(this.users.map(user => this.discord.fetchUser(user.did)));
		return this.users.filter((_, index) => !all[index]);
	}
	public async gmGuildMembers(): Promise<Discord.GuildMember[]> {
		const gmGuildMembers = (await Promise.all(this.gameMasters.map(gameMaster => this.discord.fetchGuildMember(gameMaster)))).filter(exists);
		const gmRoleDid = this.gmRoleDid;
		if (gmRoleDid) {
			const discordRole = await this.discord.fetchGuildRole(gmRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !gmGuildMembers.find(gm => gm.id === guildMember.id));
				gmGuildMembers.push(...roleOnly.values());
			}
		}
		return gmGuildMembers;
	}
	public async gmGuildMember(): Promise<Discord.GuildMember | null> {
		return this.discord.fetchGuildMember(this.gameMasters[0]);
		//TODO: LEARN HOW TO CHECK ONLINE STATUS
		// let first: Discord.GuildMember;
		// for (const gameMaster of this.gameMasters) {
		// 	const guildMember = await this.discord.fetchGuildMember(gameMaster);
		// 	const user = guildMember?.user;
		// 	if (["online"].includes(user?.presence?.status)) {
		// 		return guildMember;
		// 	}
		// 	first = first || guildMember;
		// }
		// return first || null;
	}
	public async guildRoles(): Promise<Discord.Role[]> {
		return (await Promise.all(this.roles.map(role => this.discord.fetchGuildRole(role.did)))).filter(exists);
	}
	//#endregion

	// #region Channel actions

	public async addOrUpdateChannels(...channels: IChannel[]): Promise<boolean> {
		channels.forEach(channel => {
			const found = this.getChannel(new DiscordKey(this.serverDid, channel.did));
			if (found) {
				updateChannel(found, channel);
			} else {
				(this.core.channels || (this.core.channels = [])).push({ ...channel });
			}
		});
		return this.save();
	}

	public async removeChannels(...channelDids: Discord.Snowflake[]): Promise<boolean> {
		const count = (this.core.channels || []).length;
		if (!count) {
			return false;
		}
		channelDids.forEach(channelDid => {
			this.core.channels = this.core.channels.filter(_channel => _channel.did !== channelDid);
		});
		return this.core.channels.length !== count ? this.save() : false;
	}
	// #endregion

	// #region Role actions
	public async addRole(roleType: GameRoleType, roleDid: Discord.Snowflake): Promise<boolean> {
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
	public async updateRole(roleType: GameRoleType, roleDid: Discord.Snowflake): Promise<boolean> {
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
	public async addGameMasters(userDids: Discord.Snowflake[]): Promise<boolean> {
		const filtered: Discord.Snowflake[] = [];
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

		const gameMasters = userDids.map(userDid => (<IGameUser>{ did: userDid, type: GameUserType.GameMaster }));
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
	public async removeGameMasters(userDids: Discord.Snowflake[]): Promise<boolean> {
		const filtered = userDids.filter(userDid => this.hasGameMaster(userDid));
		if (!filtered.length) {
			return false;
		}

		const nonPlayerCharacters = this.nonPlayerCharacters;
		filtered.map(userDid => nonPlayerCharacters.filter(npc => npc.userDid === userDid)).forEach(npcs => npcs.forEach(npc => delete npc.userDid));

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
	public async addPlayers(userDids: Discord.Snowflake[]): Promise<boolean> {
		const filtered: Discord.Snowflake[] = [];
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

		const players = userDids.map(userDid => (<IGameUser>{ did: userDid, type: GameUserType.Player }));
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
	public async removePlayers(userDids: Discord.Snowflake[]): Promise<boolean> {
		const filtered = userDids.filter(userDid => this.hasPlayer(userDid));
		if (!filtered.length) {
			return false;
		}

		const playerCharacters = this.playerCharacters;
		filtered.map(userDid => playerCharacters.filter(pc => pc.userDid === userDid)).forEach(pcs => pcs.forEach(pc => delete pc.userDid));

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

	public getAutoCharacterForChannel(userDid: Discord.Snowflake, ...channelDids: Optional<Discord.Snowflake>[]): GameCharacter | undefined {
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

	private updateName(name: Optional<string>): void { this.core.name = name ?? this.core.name ?? ""; }
	private updateGameType(gameType: Optional<GameType>): void { this.core.gameType = gameType === null ? undefined : gameType ?? this.core.gameType; }
	private updateCritMethodType(critMethodType: Optional<CritMethodType>): void { this.core.defaultCritMethodType = critMethodType === null ? undefined : critMethodType ?? this.core.defaultCritMethodType; }
	private updateDialogType(dialogType: Optional<DialogType>): void { this.core.defaultDialogType = dialogType === null ? undefined : dialogType ?? this.core.defaultDialogType; }
	private updateDiceOutputType(diceOutputType: Optional<DiceOutputType>): void { this.core.defaultDiceOutputType = diceOutputType === null ? undefined : diceOutputType ?? this.core.defaultDiceOutputType; }
	private updateDicePostType(dicePostType: Optional<DicePostType>): void { this.core.defaultDicePostType = dicePostType === null ? undefined : dicePostType ?? this.core.defaultDicePostType; }
	private updateDiceSecretMethodType(diceSecretMethodType: Optional<DiceSecretMethodType>): void { this.core.defaultDiceSecretMethodType = diceSecretMethodType === null ? undefined : diceSecretMethodType ?? this.core.defaultDiceSecretMethodType; }
	public async update(name: Optional<string>, gameType: Optional<GameType>, dialogType: Optional<DialogType>, critMethodType: Optional<CritMethodType>, diceOutputType: Optional<DiceOutputType>, dicePostType: Optional<DicePostType>, diceSecretMethodType: Optional<DiceSecretMethodType>): Promise<boolean> {
		this.updateName(name);
		this.updateGameType(gameType);
		this.updateCritMethodType(critMethodType);
		this.updateDialogType(dialogType);
		this.updateDiceOutputType(diceOutputType);
		this.updateDicePostType(dicePostType);
		this.updateDiceSecretMethodType(diceSecretMethodType);
		return this.save();
	}

	public async updateDicePing(userOrRoleDid: Discord.Snowflake, dicePing: boolean): Promise<boolean> {
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

	public updateGmCharacterName(gmCharacterName: string): void { this.core.gmCharacterName = gmCharacterName; }

	public async archive(): Promise<boolean> {
		this.core.archivedTs = new Date().getTime();
		return this.save();
	}

	// #region Get

	public getChannel(discordKey: DiscordKey): IChannel | undefined;
	public getChannel(channelDid: Optional<Discord.Snowflake>): IChannel | undefined;
	public getChannel(didOrKey: Optional<Discord.Snowflake> | DiscordKey): IChannel | undefined {
		if (didOrKey) {
			if (typeof(didOrKey) === "string") {
				return this.channels.find(channel => channel.did === didOrKey);
			}
			if (didOrKey.hasThread && didOrKey.hasChannel) {
				return this.channels.find(channel => channel.did === didOrKey.thread)
					?? this.channels.find(channel => channel.did === didOrKey.channel);
			}else if (didOrKey.hasThread) {
				return this.channels.find(channel => channel.did === didOrKey.thread);
			}else if (didOrKey.hasChannel) {
				return this.channels.find(channel => channel.did === didOrKey.channel);
			}
		}
		return undefined;
	}

	public getRole(roleType: GameRoleType): IGameRole | undefined {
		return this.roles.find(role => role.type === roleType);
	}

	public getUser(userDid: Optional<Discord.Snowflake>): IGameUser | undefined {
		return this.users.find(user => user.did === userDid);
	}

	public getPlayer(userDid: Optional<Discord.Snowflake>): IGameUser | undefined {
		return this.users.find(user => user.did === userDid && user.type === GameUserType.Player);
	}

	public getUsersByRole(roleType: GameRoleType): Discord.Snowflake[] {
		if ([GameRoleType.Cast, GameRoleType.Table].includes(roleType)) {
			return this.gameMasters.concat(this.players);
		}else if (roleType === GameRoleType.GameMaster) {
			return this.gameMasters;
		}else if (roleType === GameRoleType.Player) {
			return this.players;
		}
		return [];
	}

	// #endregion

	// #region Has

	public hasChannel(discordKey: DiscordKey): boolean;
	public hasChannel(channelDid: Optional<Discord.Snowflake>): boolean;
	public hasChannel(didOrKey: Optional<Discord.Snowflake> | DiscordKey): boolean {
		return this.getChannel(didOrKey as DiscordKey) !== undefined;
	}

	public hasGameMaster(userDid: Optional<Discord.Snowflake>): boolean {
		return this.getUser(userDid)?.type === GameUserType.GameMaster;
	}

	public hasPlayer(userDid: Optional<Discord.Snowflake>): boolean {
		return this.getUser(userDid)?.type === GameUserType.Player;
	}

	/** Returns true if the game has the given User. */
	public async hasUser(userDid: Optional<Discord.Snowflake>): Promise<boolean>;
	/** Returns true if the game has the given User for the given RoleType. */
	public async hasUser(userDid: Optional<Discord.Snowflake>, roleType: GameRoleType): Promise<boolean>;
	public async hasUser(userDid: Optional<Discord.Snowflake>, roleType?: GameRoleType): Promise<boolean> {
		if (!userDid) {
			return false;
		}
		if (roleType === undefined) {
			if (this.getUser(userDid) !== undefined) {
				return true;
			}
			for (const role of this.roles) {
				const bool = await hasRole(this.sageCache, userDid, role.did);
				if (bool) {
					return true;
				}
			}
			return false;
		}
		const userType = GameUserType[GameRoleType[roleType] as keyof typeof GameUserType];
		if (userType !== undefined && this.getUser(userDid)?.type === userType) {
			return true;
		}
		const roleDid = this.getRole(roleType)?.did;
		if (roleDid) {
			return hasRole(this.sageCache, userDid, roleDid);
		}
		return false;

		async function hasRole(sageCache: SageCache, _userDid: Discord.Snowflake, _roleDid: Discord.Snowflake): Promise<boolean> {
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
		return utils.ArrayUtils.Sort.stringIgnoreCase(this.name, other.name);
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

	public toDiscordColor(colorType: ColorType): string | null {
		if (!this.core.colors.length) {
			warn(`Colors Missing: Game (${this.name || this.id})`);
			return this.server.toDiscordColor(colorType);
		}
		return this.colors.toDiscordColor(colorType)
			?? this.server.toDiscordColor(colorType);
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

	public static async from(message: Discord.Message, sageCache: SageCache): Promise<Game | null> {
		if (message.guild) {
			const game = await sageCache.games.findByDiscordKey(DiscordKey.fromMessage(message));
			if (game) {
				return game;
			}
		}
		return null;
	}
}
