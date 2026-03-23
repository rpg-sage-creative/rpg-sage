import type { AutoChannelData, DiceCriticalMethodType, DiceOutputType, DiceSecretMethodType, EmbedColorType, EmojiType, GameOptions, GameRoleData, GameSystem, GameSystemType, GameUserData, PostCurrency, SageChannel, SageGameCore, SageGameCoreOld } from "@rsc-sage/data-layer";
import { DEFAULT_GM_CHARACTER_NAME, DialogPostType, DicePostType, DiceSortType, GameRoleType, GameUserType, SageChannelType, ensureSageGameCore, parseGameSystem, parseSageChannelType } from "@rsc-sage/data-layer";
import { applyChanges, error, generateSnowflake, isDefined, sortPrimitive, warn, type Args, type Comparable, type Optional, type OrNull, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey, resolveUserId, type CanBeUserIdResolvable, type SupportedGameMessagesChannel } from "@rsc-utils/discord-utils";
import type { GuildChannel, GuildMember, GuildTextBasedChannel, HexColorString, Role } from "discord.js";
import type { HasPostCurrency } from "../commands/admin/PostCurrency.js";
import type { MoveDirectionOutputType } from "../commands/map/MoveDirection.js";
import type { EncounterCore } from "../commands/trackers/encounter/Encounter.js";
import { EncounterManager } from "../commands/trackers/encounter/EncounterManager.js";
import type { PartyCore } from "../commands/trackers/party/Party.js";
import { PartyManager } from "../commands/trackers/party/PartyManager.js";
import { HasSageCacheCore } from "../repo/base/HasSageCacheCore.js";
import { CharacterManager } from "./CharacterManager.js";
import type { CharacterShell } from "./CharacterShell.js";
import { Colors, type HasColorsCore } from "./Colors.js";
import { Emojis, type HasEmojiCore } from "./Emojis.js";
import { GameCharacter, type AutoChannelResult, type GameCharacterCore } from "./GameCharacter.js";
import type { SageCache } from "./SageCache.js";
import type { Server } from "./Server.js";

type GameCoreOverrides = {
	encounters?: EncounterCore[] | EncounterManager;
	gmCharacter?: GameCharacter | GameCharacterCore;
	nonPlayerCharacters?: GameCharacterCore[] | CharacterManager;
	parties?: PartyCore[] | PartyManager;
	playerCharacters?: GameCharacterCore[] | CharacterManager;
};

export type GameCore = Omit<SageGameCore, keyof GameCoreOverrides> & GameCoreOverrides;

/** type safe helper for updating game cores */
function updateCore(core: GameCore): GameCore {
	return ensureSageGameCore(core as SageGameCoreOld) as GameCore;
}

/** deletes the character (and companions) .userId if it is one of the given userIds that were removed from the Game. */
function unlinkChar(char: GameCharacter, userIds: Snowflake[]) {
	if (userIds.includes(char.userId!)) char.userId = undefined;
	char.companions.forEach(comp => unlinkChar(comp, userIds));
}

type MappedChannelNameTags = {
	ic: boolean;
	ooc: boolean;
	gm: boolean;
	dice: boolean;
	misc: boolean;
};

type MappedGameChannel = {
	id: Snowflake;
	sChannel: SageChannel;
	gChannel: GuildTextBasedChannel | undefined;
	nameTags: MappedChannelNameTags;
};

function sageChannelTypeToNameTags(channelType?: SageChannelType): MappedChannelNameTags {
	const gm = channelType === SageChannelType.GameMaster;
	const ooc = channelType === SageChannelType.OutOfCharacter;
	const ic = channelType === SageChannelType.InCharacter;
	const dice = channelType === SageChannelType.Dice;
	const misc = !gm && !ooc && !ic && !dice;

	return { ic, gm, ooc, dice, misc };
}

/** Reads IChannel properties to determine channel type: IC, GM, OOC, MISC */
export function mapSageChannelNameTags(channel: SageChannel): MappedChannelNameTags {
	return sageChannelTypeToNameTags(channel.type);
}

export function nameTagsToType(nameTags: MappedChannelNameTags): string {
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
function mapGuildChannelNameTags(channel: GuildTextBasedChannel): MappedChannelNameTags {
	return sageChannelTypeToNameTags(parseSageChannelType(channel.name));
}

/** Returns [guildChannels.concat(sageChannels), guildChannels, sageChannels] */
async function mapChannels(channels: SageChannel[], sageCache: SageCache): Promise<[MappedGameChannel[], MappedGameChannel[], MappedGameChannel[]]> {
	const sChannels: MappedGameChannel[] = [];
	const gChannels: MappedGameChannel[] = [];
	for (const sChannel of channels) {
		sChannels.push({
			id: sChannel.id,
			sChannel: sChannel,
			gChannel: undefined, // NOSONAR
			nameTags: mapSageChannelNameTags(sChannel)
		});

		const gChannel = await sageCache.fetchChannel<SupportedGameMessagesChannel>(sChannel.id);
		if (gChannel) {
			gChannels.push({
				id: sChannel.id,
				sChannel: sChannel,
				gChannel: gChannel,
				nameTags: mapGuildChannelNameTags(gChannel)
			});
		}
	}
	return [gChannels.concat(sChannels), gChannels, sChannels];
}

export class Game extends HasSageCacheCore<GameCore> implements Comparable<Game>, HasColorsCore, HasEmojiCore, HasPostCurrency {
	public constructor(core: GameCore, public server: Server, sageCache: SageCache) {
		super(updateCore(core), sageCache);

		this.core.nonPlayerCharacters = CharacterManager.from(this.core.nonPlayerCharacters as GameCharacterCore[] ?? [], this, "npc");
		this.core.playerCharacters = CharacterManager.from(this.core.playerCharacters as GameCharacterCore[] ?? [], this, "pc");
		this.core.encounters = EncounterManager.from(this.core.encounters as EncounterCore[] ?? [], this);
		this.core.parties = PartyManager.from(this.core.parties as PartyCore[] ?? [], this);

		if (!this.core.gmCharacter) {
			let gmCharacterCore: GameCharacterCore | undefined;
			const gmCharacterName = this.core.gmCharacterName ?? this.server?.gmCharacterName ?? DEFAULT_GM_CHARACTER_NAME;
			const gmCharacter = this.nonPlayerCharacters.findByName(gmCharacterName);
			if (gmCharacter) {
				const index = this.nonPlayerCharacters.indexOf(gmCharacter);
				if (index > -1) this.nonPlayerCharacters.splice(index, 1);
				gmCharacterCore = gmCharacter.toJSON();
			}
			if (!gmCharacterCore) {
				gmCharacterCore = { id:generateSnowflake(), name:gmCharacterName, objectType:"Character" };
			}
			this.core.gmCharacter = gmCharacterCore;
		}
		this.core.gmCharacter = CharacterManager.from([this.core.gmCharacter as GameCharacterCore], this, "gm")[0];
	}

	public get createdDate(): Date { return new Date(this.core.createdTs ?? 283305600000); }
	public get archivedDate(): Date | undefined { return this.core.archivedTs ? new Date(this.core.archivedTs) : undefined; }
	public get isArchived(): boolean { return this.core.createdTs && this.core.archivedTs ? this.core.createdTs < this.core.archivedTs : false; }

	public get name(): string { return this.core.name; }

	//#region dialog options

	public get dialogPostType(): DialogPostType | undefined { return this.core.dialogPostType; }
	// gmCharacterName
	public get mentionPrefix(): string | undefined { return this.core.mentionPrefix; }
	public get moveDirectionOutputType(): MoveDirectionOutputType | undefined { return this.core.moveDirectionOutputType; }
	// sendDialogTo

	//#endregion

	//#region dice options

	public get diceCritMethodType(): DiceCriticalMethodType | undefined { return this.core.diceCritMethodType; }
	public get diceOutputType(): DiceOutputType | undefined { return this.core.diceOutputType; }
	public get dicePostType(): DicePostType | undefined { return this.core.dicePostType; }
	public get diceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.diceSecretMethodType; }
	public get diceSortType(): DiceSortType | undefined { return this.core.diceSortType; }
	// sendDiceTo

	//#endregion

	//#region game system options

	public get gameSystemType(): GameSystemType | undefined { return this.core.gameSystemType; }

	//#region derived
	private _gameSystem?: GameSystem | null;
	public get gameSystem(): GameSystem | undefined { return this._gameSystem === null ? undefined : (this._gameSystem = parseGameSystem(this.core.gameSystemType) ?? null) ?? undefined; }
	//#endregion

	//#endregion


	public get serverDid(): Snowflake { return this.core.serverDid; }

	public get macros() { return this.core.macros ??= []; }

	public get gmRole(): GameRoleData | undefined { return this.getRole(GameRoleType.GameMaster); }
	public get playerRole(): GameRoleData | undefined { return this.getRole(GameRoleType.Player); }

	/** Returns users assigned manually, NOT users assigned via Player role. */
	private get players(): Snowflake[] { return this.users.filter(user => user.type === GameUserType.Player).map(user => user.did); }
	/** Returns users assigned manually, NOT users assigned via GameMaster role. */
	public get gameMasters(): Snowflake[] { return this.users.filter(user => user.type === GameUserType.GameMaster).map(user => user.did); }

	public get channels(): SageChannel[] { return this.core.channels ??= []; }
	public get gmCharacter(): GameCharacter { return this.core.gmCharacter as GameCharacter; }
	public get nonPlayerCharacters(): CharacterManager { return this.core.nonPlayerCharacters as CharacterManager; }
	public get playerCharacters(): CharacterManager { return this.core.playerCharacters as CharacterManager; }
	public findCharacterOrCompanion(name: string): GameCharacter | CharacterShell | undefined {
		if (this.gmCharacter.matches(name)) return this.gmCharacter;
		return this.playerCharacters.findByName(name)
			?? this.playerCharacters.findCompanionByName(name)
			?? this.nonPlayerCharacters.findByName(name)
			?? this.nonPlayerCharacters.findCompanionByName(name)
			?? this.encounters.findCharacter(name)
			?? this.parties.findCharacter(name);
	}
	public get roles(): GameRoleData[] { return this.core.roles ??= []; }
	public get users(): GameUserData[] { return this.core.users ??= []; }

	public get encounters(): EncounterManager { return this.core.encounters as EncounterManager; }
	public get parties(): PartyManager { return this.core.parties as PartyManager; }
	public get postCurrency(): PostCurrency { return this.core.postCurrency ??= {}; }

	//#region Guild fetches

	/** Returns the "best" channel for the given type/purpose. */
	public async findBestChannel(type: "ic" | "gm"): Promise<SageChannel | undefined> {
		if (type === "ic") {
			const [allChannels, gChannels, sChannels] = await mapChannels(this.channels, this.sageCache);
			return (
					allChannels.find(channel => channel.nameTags.ic)
					?? allChannels.find(channel => channel.nameTags.ooc)
					?? sChannels.find(channel => !channel.nameTags.gm)
					?? gChannels.find(channel => !channel.nameTags.gm)
				)?.sChannel;
		}
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
				const gChannel = await this.sageCache.fetchChannel(sChannel.id);
				if (gChannel) {
					return gChannel as GuildChannel;
				}
			}
		}
		return null;
	}

	/** Returns all players (manual and role) as GuildMember objects. */
	public async pGuildMembers(): Promise<GuildMember[]> {
		const { discord } = this.sageCache;
		const pGuildMembers = await Promise.all(this.players.map(player => discord.fetchGuildMember(player)));
		const pRoleDid = this.playerRole?.did;
		if (pRoleDid) {
			const discordRole = await discord.fetchGuildRole(pRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !pGuildMembers.some(p => p?.id === guildMember.id));
				pGuildMembers.push(...roleOnly.values());
			}
		}
		return pGuildMembers.filter(isDefined);
	}

	/** Returns all manually added channels as GuildTextBasedChannel objects. */
	public async guildChannels(): Promise<GuildTextBasedChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.sageCache.fetchChannel(channel.id)));
		return all.filter(isDefined) as GuildTextBasedChannel[];
	}

	/** Returns all manually added channels that are not found on this Server. */
	public async orphanChannels(): Promise<SageChannel[]> {
		const all = await Promise.all(this.channels.map(channel => this.sageCache.fetchChannel(channel.id)));
		return this.channels.filter((_, index) => !all[index]);
	}

	/** Returns all manually added users that are not found on this Server. */
	public async orphanUsers(): Promise<GameUserData[]> {
		const { discord } = this.sageCache;
		const all = await Promise.all(this.users.map(user => discord.fetchGuildMember(user.did)));
		return this.users.filter((_, index) => !all[index]);
	}

	/** Returns all game masters (manual and role) as GuildMember objects. */
	public async gmGuildMembers(): Promise<GuildMember[]> {
		const { discord } = this.sageCache;
		const gmGuildMembers = await Promise.all(this.gameMasters.map(gameMaster => discord.fetchGuildMember(gameMaster)));
		const gmRoleDid = this.gmRole?.did;
		if (gmRoleDid) {
			const discordRole = await discord.fetchGuildRole(gmRoleDid);
			if (discordRole) {
				const roleOnly = discordRole.members.filter(guildMember => !gmGuildMembers.some(gm => gm?.id === guildMember.id));
				gmGuildMembers.push(...roleOnly.values());
			}
		}
		return gmGuildMembers.filter(isDefined);
	}

	/** Returns the first gm that has a presence of "online". if none are "online" then the first gm is returned. */
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

	/** Returns discord role objects for all roles set in the Game. */
	public async guildRoles(): Promise<Role[]> {
		const { discord } = this.sageCache;
		const all = await Promise.all(this.roles.map(role => discord.fetchGuildRole(role.did)));
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

	public async setRole({ type, did, dicePing }: GameRoleData): Promise<boolean> {
		// find existing
		const role = this.getRole(type);
		if (role) {
			// return false for no changes
			if (role.did === did && role.dicePing === dicePing) {
				return false;
			}
			// make changes
			role.did = did;
			role.dicePing = dicePing ?? role.dicePing;

		}else {
			// add a new one
			(this.core.roles ??= []).push({ type, did, dicePing:dicePing ?? true });
		}
		return this.save();
	}

	public async unsetRole(type: GameRoleType): Promise<boolean> {
		// count roles before filtering
		const length = this.core.roles?.length;

		// filter roles
		this.core.roles = this.core.roles?.filter(role => role.type !== type);

		// if we have a different count, save it
		if (this.core.roles?.length !== length) {
			return this.save();
		}

		// return false for no changes
		return false;
	}

	// #endregion

	// #region GameMaster actions

	/** add the given users as gms, first removing them as players if needed */
	public async addGameMasters(userIds: Snowflake[]): Promise<boolean> {
		// filtered list of the given user ids that need to be added
		const toAdd: Snowflake[] = [];

		// iterate the given user ids
		for (const userId of userIds) {
			// see if the user is already in the Game
			const user = this.getUser(userId);
			if (user) {
				// if the user is not a gamemaster, then we need to remove them before adding them as a gamemaster
				if (user.type !== GameUserType.GameMaster) {
					// remove them as player
					await this.removePlayers([userId], false);
					// now add them
					toAdd.push(userId);
				}
			} else {
				// not in the game yet, add them
				toAdd.push(userId);
			}
		}

		// if we have nothing to add, return false
		if (!toAdd.length) {
			return false;
		}

		// ensure users array
		const users = this.core.users ??= [];

		// add each user
		for (const userId of toAdd) {
			users.push({ did: userId, type: GameUserType.GameMaster, dicePing:true });
		}

		// save the game
		return this.save();
	}

	/** remove user as a gamemaster. unlink when they leave a game, don't unlink if switching between gm/player */
	public async removeGameMasters(userIds: Snowflake[], unlinkChars: boolean): Promise<boolean> {
		// make sure they are gamemasters
		const toRemove = userIds.filter(userId => this.hasGameMaster(userId));
		if (!toRemove.length) {
			return false;
		}

		// unlink to save the gms hassle
		if (unlinkChars) {
			unlinkChar(this.gmCharacter, toRemove);
			this.nonPlayerCharacters.forEach(char => unlinkChar(char, toRemove));
			this.playerCharacters.forEach(char => unlinkChar(char, toRemove));
		}

		// filter users to have only non-gms or gms not removed
		this.core.users = this.core.users!.filter(user => user.type !== GameUserType.GameMaster || !toRemove.includes(user.did));

		// save the game
		return this.save();
	}

	// #endregion GameMaster actions

	// #region Player actions

	/** add the given users as players, first removing them as gms if needed */
	public async addPlayers(userIds: Snowflake[]): Promise<boolean> {
		// filtered list of the given user ids that need to be added
		const toAdd: Snowflake[] = [];

		// iterate the given user ids
		for (const userId of userIds) {
			// see if the user is already in the Game
			const user = this.getUser(userId);
			if (user) {
				// if the user is not a player, then we need to remove them before adding them as a player
				if (user.type !== GameUserType.Player) {
					// remove them as gamemaster
					await this.removeGameMasters([userId], false);
					// now add them
					toAdd.push(userId);
				}
			} else {
				// not in the game yet, add them
				toAdd.push(userId);
			}
		}

		// if we have nothing to add, return false
		if (!toAdd.length) {
			return false;
		}

		// ensure users array
		const users = this.core.users ??= [];

		// add each user
		for (const userId of toAdd) {
			users.push({ did: userId, type: GameUserType.Player, dicePing:true });
		}

		// save the game
		return this.save();
	}

	/** remove user as a player. unlink when they leave a game, don't unlink if switching between gm/player */
	public async removePlayers(userIds: Snowflake[], unlinkChars: boolean): Promise<boolean> {
		// make sure they are players
		const toRemove = userIds.filter(userId => this.hasPlayer(userId));
		if (!toRemove.length) {
			return false;
		}

		// unlink to save the gms hassle
		if (unlinkChars) {
			unlinkChar(this.gmCharacter, toRemove);
			this.nonPlayerCharacters.forEach(char => unlinkChar(char, toRemove));
			this.playerCharacters.forEach(char => unlinkChar(char, toRemove));
		}

		// filter users to have only non-players or players not removed
		this.core.users = this.core.users!.filter(user => user.type !== GameUserType.Player || !toRemove.includes(user.did));

		// save the game
		return this.save();
	}

	// #endregion PC actions

	public getAutoCharacterForChannel(autoArg: AutoChannelData): AutoChannelResult | undefined {
		const autoResult = this.playerCharacters.getAutoCharacter(autoArg)
			?? this.nonPlayerCharacters.getAutoCharacter(autoArg);
		if (autoResult) {
			return autoResult;
		}
		if (this.gmCharacter.hasAutoChannel(autoArg)) {
			return { char:this.gmCharacter, data:autoArg };
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
		const gameRole = this.getRole(userOrRoleDid);
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

	/**
	 * returns a list of players entrusted by GMs to help admin other characters.
	 * includes players entrusted by other players to help admin their characters.
	 * includes a character's owner.
	 * @todo implement logic to let GMs and players edit this list
	 */
	public getTrustedPlayers(character?: GameCharacter | CharacterShell): Snowflake[] {
		const trusted: Snowflake[] = [];

		// add character owner
		if (character?.userId) {
			trusted.push(character.userId);
		}

		// add GMs
		this.users.forEach(user => {
			if (user.type === GameUserType.GameMaster) {
				trusted.push(user.did);
			}
		});

		// add entrusted users

		return trusted;
	}

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

	public getRole(value: GameRoleType | Snowflake): GameRoleData | undefined {
		return this.roles.find(role => role.type === value || role.did === value);
	}

	/** returns the user info for a manually added (not via role) user */
	public getUser(userResolvable: Optional<CanBeUserIdResolvable>): GameUserData | undefined {
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

	/** returns true if the user was manually added (not via role) as a gamemaster */
	public hasGameMaster(userResolvable: Optional<CanBeUserIdResolvable>): boolean {
		return this.getUser(userResolvable)?.type === GameUserType.GameMaster;
	}

	/** returns true if the user was manually added (not via role) as a player */
	public hasPlayer(userResolvable: Optional<CanBeUserIdResolvable>): boolean {
		return this.getUser(userResolvable)?.type === GameUserType.Player;
	}

	/** Only used by SageEventCache. */
	public hasUser(userId: Snowflake, userRoleIds: Snowflake[], gameUserType: GameUserType): boolean {
		const gameRoleType = GameRoleType[GameUserType[gameUserType] as keyof typeof GameRoleType];
		return this.users.some(gameUser => gameUser.type === gameUserType && gameUser.did === userId)
			|| this.roles.some(gameRole => gameRole.type === gameRoleType && userRoleIds.includes(gameRole.did));
	}

	// #endregion

	public async save(): Promise<boolean> {
		return this.sageCache.saveGame(this);
	}

	// #region IComparable
	public compareTo(other: Game): -1 | 0 | 1 {
		return sortPrimitive(this.name, other.name);
	}
	// #endregion

	// #region IHasColorsCore

	private _colors?: Colors;

	public get colors(): Colors {
		this._colors ??= new Colors(this.core.colors ??= []);
		return this._colors;
	}

	public toHexColorString(colorType: EmbedColorType): HexColorString | undefined {
		if (!this.core.colors?.length) {
			warn(`Colors Missing: Game (${this.name || this.id})`);
			return this.server.toHexColorString(colorType);
		}
		return this.colors.toHexColorString(colorType)
			?? this.server.toHexColorString(colorType);
	}

	// #endregion

	// #region IHasEmoji

	private _emoji?: Emojis;

	public get emoji(): Emojis {
		this._emoji ??= new Emojis(this.core.emoji ??= []);
		return this._emoji;
	}

	public emojify(text: string): string {
		try {
			text = this.emoji.emojify(text);
			text = this.server.emojify(text);
		}catch(ex) {
			error({ gameId:this.id, serverDid:this.serverDid }, ex);
		}
		return text;
	}

	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType)
			?? this.server.getEmoji(emojiType);
	}

	// #endregion

}
