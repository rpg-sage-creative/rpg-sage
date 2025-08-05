import type { DialogPostType, DicePostType, SageChannel, ServerOptions } from "@rsc-sage/types";
import { updateServer } from "@rsc-sage/types";
import { applyChanges, randomSnowflake, warn, type Args, type IdCore, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey, getHomeServerId } from "@rsc-utils/discord-utils";
import { parseGameSystem, type DiceCriticalMethodType, type DiceOutputType, type DiceSecretMethodType, type DiceSortType, type GameSystem, type GameSystemType } from "@rsc-utils/game-utils";
import type { Guild, HexColorString } from "discord.js";
import { ActiveBot } from "../model/ActiveBot.js";
import { HasSageCacheCore } from "../repo/base/HasSageCacheCore.js";
import { CharacterManager } from "./CharacterManager.js";
import { Colors } from "./Colors.js";
import { Emoji } from "./Emoji.js";
import type { Game } from "./Game.js";
import { GameCharacter, type GameCharacterCore } from "./GameCharacter.js";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore.js";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore.js";
import type { MacroBase } from "./Macro.js";
import type { SageCache } from "./SageCache.js";

export type TAdminRoleType = keyof typeof AdminRoleType;
export enum AdminRoleType { Unknown = 0, GameAdmin = 1, ServerAdmin = 2, SageAdmin = 3 }
export interface IAdminRole { did: Snowflake; type: AdminRoleType; }
export interface IAdminUser { did: Snowflake; role: AdminRoleType; }

export interface ServerCore extends IdCore<"Server">, IHasColors, IHasEmoji, Partial<ServerOptions> {
	admins: IAdminUser[];
	channels: SageChannel[];
	commandPrefix?: string;
	gameId?: string;
	gmCharacter?: GameCharacter | GameCharacterCore;
	name: string;
	roles: IAdminRole[];
	macros?: MacroBase[];
}

// export abstract class HasDiceOptions<Core extends Partial<DiceOptions>> {
// 	declare protected core: Core;
// 	public get diceCritMethodType(): DiceCritMethodType | undefined { return this.core.diceCritMethodType; }
// 	public get diceOutputType(): DiceOutputType | undefined { return this.core.diceOutputType; }
// 	public get dicePostType(): PostType | undefined { return this.core.dicePostType; }
// 	public get diceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.diceSecretMethodType; }
// }

export class Server extends HasSageCacheCore<ServerCore> implements IHasColorsCore, IHasEmojiCore {
	public constructor(core: ServerCore, sageCache: SageCache) {
		super(updateServer(core), sageCache);

		if (!this.core.gmCharacter) {
			this.core.gmCharacter = { id:randomSnowflake(), name:"" };
		}
		this.core.gmCharacter.name = this.core.gmCharacterName ?? GameCharacter.defaultGmCharacterName;
		this.core.gmCharacter = new GameCharacter(this.core.gmCharacter as GameCharacterCore, CharacterManager.from([this.core.gmCharacter as GameCharacterCore], this, "gm"));
	}

	// #region Public Properties
	public get admins(): IAdminUser[] { return this.core.admins ?? []; }
	public get channels(): SageChannel[] { return this.core.channels ?? []; }
	public get commandPrefix(): string | undefined { return this.core.commandPrefix; }
	public get dialogPostType(): DialogPostType | undefined { return this.core.dialogPostType; }
	public get diceCritMethodType(): DiceCriticalMethodType | undefined { return this.core.diceCritMethodType; }
	public get diceOutputType(): DiceOutputType | undefined { return this.core.diceOutputType; }
	public get dicePostType(): DicePostType | undefined { return this.core.dicePostType; }
	public get diceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.diceSecretMethodType; }
	public get diceSortType(): DiceSortType | undefined { return this.core.diceSortType; }
	public get gameId(): string | undefined { return this.core.gameId; }
	public set gameId(gameId: string | undefined) { this.core.gameId = gameId; }
	private _gameSystem?: GameSystem | null;
	public get gameSystem(): GameSystem | undefined { return this._gameSystem === null ? undefined : (this._gameSystem = parseGameSystem(this.core.gameSystemType) ?? null) ?? undefined; }
	public get gameSystemType(): GameSystemType | undefined { return this.core.gameSystemType; }
	/** The default gm character name for the server. */
	public get gmCharacterName(): string { return this.core.gmCharacterName ?? GameCharacter.defaultGmCharacterName; }
	/** The generic Game Master for the Server. */
	public get gmCharacter(): GameCharacter { return this.core.gmCharacter as GameCharacter; }
	public get discord() { return this.sageCache.discord; }
	public get name(): string { return this.core.name; }
	public get roles(): IAdminRole[] { return this.core.roles ?? []; }
	public get macros() { return this.core.macros ?? (this.core.macros = []); }
	// #endregion

	// #region has/is flags
	public get hasAdmins(): boolean { return this.admins.length > 0; }
	public get hasEmoji(): boolean { return this.emoji.size > 0; }
	public get hasRoles(): boolean { return this.roles.length > 0; }

	//TODO: sort out server active state/status
	public get isActive(): boolean { return true; }
	public get isHome(): boolean { return Server.isHome(this.did); }
	// #endregion

	// #region Game actions
	public async findActiveGame(channelId: Snowflake): Promise<Game | undefined> {
		// check to see if we have a server-wide game
		if (this.core.gameId) {
			const game = await this.sageCache.getOrFetchGame(this.core.gameId);
			if (game && !game.isArchived) {
				return game;
			}
		}
		return this.sageCache.findActiveGame({ guildId:this.did, channelId, messageId:undefined });
	}
	// public async addGame(channelDid: Snowflake, name: string, _gameType: Optional<GameType>, _dialogType: Optional<DialogType>, _critMethodType: Optional<CritMethodType>, _diceOutputType: Optional<DiceOutputType>, _dicePostType: Optional<DicePostType>, _diceSecretMethodType: Optional<DiceSecretMethodType>): Promise<boolean> {
	// 	const found = await this.findActiveGameByChannelDid(channelDid);
	// 	if (found) {
	// 		return false;
	// 	}
	// 	const gameType = _gameType ?? this.defaultGameType;
	// 	const critMethodType = _critMethodType ?? this.defaultCritMethodType;
	// 	const dialogType = _dialogType ?? this.defaultDialogType;
	// 	const diceOutputType = _diceOutputType ?? this.defaultDiceOutputType;
	// 	const dicePostType = _dicePostType ?? this.defaultDicePostType;
	// 	const diceSecretMethodType = _diceSecretMethodType ?? this.defaultDiceSecretMethodType;
	// 	const game = new Game({
	// 		objectType: "Game",
	// 		id: randomSnowflake(),
	// 		serverDid: this.did,
	// 		serverId: this.id,
	// 		createdTs: new Date().getTime(),
	// 		name: name,
	// 		gameType: gameType,
	// 		defaultCritMethodType: critMethodType,
	// 		defaultDialogType: dialogType,
	// 		defaultDiceOutputType: diceOutputType,
	// 		defaultDicePostType: dicePostType,
	// 		defaultDiceSecretMethodType: diceSecretMethodType,
	// 		channels: [{ id: channelDid, admin: true }],
	// 		colors: this.colors.toArray()
	// 	}, this, this.sageCache);
	// 	if (await game.save()) {
	// 		return this.save();
	// 	}
	// 	return false;
	// }
	// #endregion

	// #region Role actions
	public async addRole(roleType: AdminRoleType, roleDid: Snowflake): Promise<boolean> {
		const found = this.getRole(roleType);
		if (found) {
			return false;
		}
		const role = { did: roleDid, type: roleType };
		(this.core.roles || (this.core.roles = [])).push(role);
		const saved = await this.save();
		// if (saved) {
		// 	const userDids = this.getUsersByRole(role.type).map(user => user.did);
		// 	await Roles.addRoleToUser(this.sageCache, role.did, userDids);
		// }
		return saved;
	}
	public async updateRole(roleType: AdminRoleType, roleDid: Snowflake): Promise<boolean> {
		const role = this.getRole(roleType);
		if (!role || role.did === roleDid) {
			return false;
		}
		// const oldRole = { type:role.type, did:role.did };
		role.did = roleDid;
		const saved = await this.save();
		// if (saved) {
		// 	const userDids = this.getUsersByRole(oldRole.type).map(user => user.did);
		// 	await Roles.updateRoleForUser(this.sageCache, oldRole.did, role.did, userDids);
		// }
		return saved;
	}
	public async removeRole(roleType: AdminRoleType): Promise<boolean> {
		const role = this.getRole(roleType);
		if (!role) {
			return false;
		}
		this.core.roles = this.core.roles.filter(_role => _role !== role);
		const saved = await this.save();
		// if (saved) {
		// 	const userDids = this.getUsersByRole(role.type).map(user => user.did);
		// 	await Roles.removeRoleFromUser(this.sageCache, role.did, userDids);
		// }
		return saved;
	}
	// #endregion

	// #region Admin actions
	public async addAdmin(userDid: Snowflake, roleType: AdminRoleType): Promise<boolean | AdminRoleType> {
		const found = this.getAdmin(userDid);
		if (found) {
			return found.role;
		}
		const admin: IAdminUser = { did: userDid, role: roleType };
		(this.core.admins || (this.core.admins = [])).push(admin);
		const saved = await this.save();
		// if (saved) {
		// 	const role = this.getRole(roleType);
		// 	await Roles.addRoleToUser(this.sageCache, role?.did, userDid);
		// }
		return saved;
	}
	public async updateAdminRole(userDid: Snowflake, roleType: AdminRoleType): Promise<Optional<boolean>> {
		const found = this.getAdmin(userDid);
		if (!found) {
			return null;
		}
		if (found.role === roleType) {
			return undefined;
		}
		// const oldRoleType = found.role;
		found.role = roleType;
		const saved = await this.save();
		// if (saved) {
		// 	const oldRole = this.getRole(oldRoleType);
		// 	const newRole = this.getRole(roleType);
		// 	await Roles.updateRoleForUser(this.sageCache, oldRole?.did, newRole?.did, userDid);
		// }
		return saved;
	}
	public async removeAdmin(userDid: Snowflake): Promise<boolean | null> {
		const found = this.getAdmin(userDid);
		if (!found) {
			return null;
		}
		this.core.admins = this.core.admins.filter(admin => admin !== found);
		const saved = await this.save();
		// if (saved) {
		// 	const roleDids = this.roles.map(role => role.did);
		// 	await Roles.removeRoleFromUser(this.sageCache, roleDids, userDid);
		// }
		return saved;
	}
	// #endregion

	// #region Channel actions
	public async addOrUpdateChannels(...channels: Args<SageChannel>[]): Promise<boolean> {
		channels.forEach(channel => {
			const found = this.getChannel(new DiscordKey(this.did, channel.id));
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
	public async removeChannels(...channelDids: Optional<Snowflake>[]): Promise<boolean> {
		const count = (this.core.channels ?? []).length;
		if (!count) {
			return false;
		}
		channelDids.forEach(channelDid => {
			if (channelDid) {
				this.core.channels = this.core.channels.filter(_channel => _channel.id !== channelDid);
			}
		});
		return this.core.channels.length !== count ? this.save() : false;
	}
	// #endregion

	// #region get

	public getAdmin(userDid: Snowflake): IAdminUser | undefined {
		return this.admins.find(admin => admin.did === userDid);
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

	public getRole(roleType: AdminRoleType): IAdminRole | undefined {
		return this.roles.find(role => role.type === roleType);
	}

	public getUsersByRole(roleType: AdminRoleType): IAdminUser[] {
		switch (roleType) {
			case AdminRoleType.SageAdmin: return this.admins;
			case AdminRoleType.ServerAdmin: return this.admins.filter(admin => admin.role === AdminRoleType.ServerAdmin);
			case AdminRoleType.GameAdmin: return this.admins.filter(admin => admin.role === AdminRoleType.GameAdmin);
			default: return [];
		}
	}
	// #endregion

	// #region has

	public hasChannel(discordKey: DiscordKey): boolean;
	public hasChannel(channelDid: Optional<Snowflake>): boolean;
	public hasChannel(didOrKey: Optional<Snowflake> | DiscordKey): boolean {
		return this.getChannel(didOrKey as DiscordKey) !== undefined;
	}

	/** Can admin anything Sage related. */
	public hasSageAdmin(userDid: Snowflake): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === AdminRoleType.SageAdmin) !== undefined;
	}

	/** Can admin only server options. */
	public hasServerAdmin(userDid: Snowflake): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === AdminRoleType.ServerAdmin) !== undefined;
	}

	/** Can admin only game options. */
	public hasGameAdmin(userDid: Snowflake): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === AdminRoleType.GameAdmin) !== undefined;
	}

	// #endregion

	public async save(): Promise<boolean> {
		return this.sageCache.saveServer(this);
	}

	// #region command Prefix override
	public getPrefixOrDefault(): string {
		/** If a DM with bot, no need for a command prefix. */
		if (!this.id) {
			return "";
		}

		/** Test the server for an override */
		if (typeof (this.commandPrefix) === "string") {
			return this.commandPrefix;
		}

		/** Use the bot's default */
		return this.sageCache.bot.commandPrefix;
	}
	public async setCommandPrefix(commandPrefix: string): Promise<boolean> {
		this.core.commandPrefix = commandPrefix || "";
		return this.save();
	}
	public async syncCommandPrefix(): Promise<boolean> {
		delete this.core.commandPrefix;
		return this.save();
	}
	public async unsetCommandPrefix(): Promise<boolean> {
		this.core.commandPrefix = "";
		return this.save();
	}
	// #endregion

	//#region update (defaultGame, defaultDiceOutput)
	public async update(changes: Args<ServerOptions>): Promise<boolean> {
		const changed = applyChanges(this.core, changes);
		if (changed) {
			return this.save();
		}
		return false;
	}
	//#endregion

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
			warn(`Colors Missing: Server (${this.discord?.guild?.name ?? this.id})`);
			return this.sageCache.bot.toHexColorString(colorType);
		}
		return this.colors.toHexColorString(colorType)
			?? this.sageCache.bot.toHexColorString(colorType);
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
		return this.sageCache.bot.emojify(this.emoji.emojify(text));
	}

	public getEmoji(emojiType: EmojiType): string | null {
		return this.emoji.get(emojiType) ?? this.sageCache.bot.getEmoji(emojiType);
	}

	// #endregion

	public static createCore(guild: Guild): ServerCore {
		const activeBot = ActiveBot.active;
		return {
			admins: [],
			channels: [],
			colors: activeBot.colors.toArray(),
			did: guild.id as Snowflake,
			emoji: [],
			// dialogPostType: DialogPostType.Embed,
			// diceCritMethodType: DiceCritMethodType.Unknown,
			// diceOutputType: DiceOutputType.M,
			// dicePostType: DicePostType.SinglePost,
			// diceSecretMethodType: DiceSecretMethodType.Ignore,
			// gameSystemType: GameSystemType.None,
			gmCharacterName: GameCharacter.defaultGmCharacterName,
			id: guild.id,
			name: guild.name,
			objectType: "Server",
			commandPrefix: activeBot.commandPrefix,
			roles: []
		};
	}

	public static isHome(serverId: Snowflake): boolean {
		return serverId === getHomeServerId();
	}
}

// export interface Server extends HasDiceOptions<ServerCore> { }

// applyMixins(Server, [HasDiceOptions]);