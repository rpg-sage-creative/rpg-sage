import type { Guild, Snowflake } from "discord.js";
import { GameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import utils, { Args, LogLevel, Optional, TConsoleCommandType } from "../../../sage-utils";
import DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import { cleanJson } from "../../../sage-utils/utils/JsonUtils";
import { DicePostType } from "../commands/dice";
import ActiveBot from "../model/ActiveBot";
import { DialogType, IChannel, IChannelOptions, updateChannel } from "../repo/base/channel";
import { DidCore, HasDidCore } from "../repo/base/DidRepository";
import Colors from "./Colors";
import Emoji from "./Emoji";
import Game, { getDefaultGameOptions, TDefaultGameOptions } from "./Game";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore";
import { applyValues, hasValues, ISageCommandArgs } from "./SageCommandArgs";

export type TAdminRoleType = keyof typeof AdminRoleType;
export enum AdminRoleType { Unknown = 0, GameAdmin = 1 }
export interface IAdminRole { did: Snowflake; type: AdminRoleType; }
export interface IAdminUser { did: Snowflake; role: AdminRoleType; }

type IChannelArgs = Args<IChannelOptions> & { did:Snowflake; };

export type TServerDefaultGameOptions = TDefaultGameOptions & {
	defaultGameType: GameType;
	defaultGmCharacterName: string;
}

export function getServerDefaultGameOptions(args: ISageCommandArgs): Args<TServerDefaultGameOptions> | null {
	const opts: Args<TServerDefaultGameOptions> = {
		...getDefaultGameOptions(args),
		defaultGameType: args.getEnum(GameType, "gameType"),
		defaultGmCharacterName: args.getString("gmCharName")
	};
	return hasValues(opts) ? opts : null;
}


export interface ServerCore extends DidCore<"Server">, IHasColors, IHasEmoji, Partial<TServerDefaultGameOptions> {
	admins: IAdminUser[];
	channels: IChannel[];
	commandPrefix?: string;
	logLevel: TConsoleCommandType;
	name: string;
	roles: IAdminRole[];
}

export default class Server extends HasDidCore<ServerCore> implements IHasColorsCore, IHasEmojiCore {

	// #region Private Properties

	private _logLevel?: LogLevel;

	// #endregion

	// #region Public Properties

	public get admins(): IAdminUser[] { return this.core.admins ?? []; }
	public get channels(): IChannel[] { return this.core.channels ?? []; }
	public get commandPrefix(): string | undefined { return this.core.commandPrefix; }
	public get defaultCritMethodType(): CritMethodType | undefined { return this.core.defaultCritMethodType; }
	public get defaultDialogType(): DialogType | undefined { return this.core.defaultDialogType; }
	public get defaultDiceOutputType(): DiceOutputType | undefined { return this.core.defaultDiceOutputType; }
	public get defaultDicePostType(): DicePostType | undefined { return this.core.defaultDicePostType; }
	public get defaultDiceSecretMethodType(): DiceSecretMethodType | undefined { return this.core.defaultDiceSecretMethodType; }
	public get defaultGameType(): GameType | undefined { return this.core.defaultGameType; }
	public get defaultGmCharacterName(): string { return this.core.defaultGmCharacterName ?? "Game Master"; }
	public get discord() { return this.sageCache.discord; }
	public get logLevel(): LogLevel | null { return this._logLevel !== undefined ? this._logLevel : (this._logLevel = LogLevel[this.core.logLevel] ?? null); }
	public get name(): string { return this.core.name; }
	public get roles(): IAdminRole[] { return this.core.roles ?? []; }

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

	public async findActiveGameByChannelDid(channelDid: Snowflake): Promise<Game | undefined> {
		return this.sageCache.games.findActiveByDiscordKey(DiscordKey.from({ server:this.did, channel:channelDid }));
	}

	public async addGame(channelDid: Snowflake, name: string, _gameType: Optional<GameType>, _dialogType: Optional<DialogType>, _critMethodType: Optional<CritMethodType>, _diceOutputType: Optional<DiceOutputType>, _dicePostType: Optional<DicePostType>, _diceSecretMethodType: Optional<DiceSecretMethodType>): Promise<boolean> {
		const found = await this.findActiveGameByChannelDid(channelDid);
		if (found) {
			return false;
		}
		const gameType = _gameType ?? this.defaultGameType;
		const critMethodType = _critMethodType ?? this.defaultCritMethodType;
		const dialogType = _dialogType ?? this.defaultDialogType;
		const diceOutputType = _diceOutputType ?? this.defaultDiceOutputType;
		const dicePostType = _dicePostType ?? this.defaultDicePostType;
		const diceSecretMethodType = _diceSecretMethodType ?? this.defaultDiceSecretMethodType;
		const game = new Game({
			objectType: "Game",
			id: utils.UuidUtils.generate(),
			serverDid: this.did,
			serverId: this.id,
			createdTs: new Date().getTime(),
			name: name,
			gameType: gameType,
			defaultCritMethodType: critMethodType,
			defaultDialogType: dialogType,
			defaultDiceOutputType: diceOutputType,
			defaultDicePostType: dicePostType,
			defaultDiceSecretMethodType: diceSecretMethodType,
			channels: [{ did: channelDid, admin: true }],
			colors: this.colors.toArray()
		}, this, this.sageCache);
		if (await game.save()) {
			return this.save();
		}
		return false;
	}

	// #endregion

	// #region Role actions

	/** Removes the Role. */
	public async setRole(roleType: AdminRoleType, roleDid: null): Promise<boolean>;
	/** Adds or updates the Role. */
	public async setRole(roleType: AdminRoleType, roleDid: Snowflake): Promise<boolean>;
	public async setRole(type: AdminRoleType, did?: Optional<Snowflake>): Promise<boolean> {
		let save = false;
		const found = this.getRole(type);

		// Delete
		if (!did) {
			// Only delete if it exists
			if (found) {
				this.core.roles = this.core.roles.filter(_role => _role !== found);
				save = true;
			}

		// Add/Update
		}else {
			// Update
			if (found) {
				// Only update if different
				if (found.did !== did) {
					found.did = did;
					save = true;
				}

			// Add
			}else {
				(this.core.roles ?? (this.core.roles = [])).push({ did, type });
				save = true;
			}
		}

		// Only save if something changed
		if (save) {
			return this.save();
		}

		return false;
	}

	// #endregion

	// #region Admin actions

	/** Removes the Admin. */
	public async setAdmin(userDid: Snowflake, roleType: null): Promise<boolean>;
	/** Adds or updates the Admin. */
	public async setAdmin(userDid: Snowflake, roleType: AdminRoleType): Promise<boolean>;
	public async setAdmin(did: Snowflake, role?: Optional<AdminRoleType>): Promise<boolean> {
		let save = false;
		const found = this.getAdmin(did);

		// Delete
		if (!role) {
			// Only delete if it exists
			if (found) {
				this.core.admins = this.core.admins.filter(_admin => _admin !== found);
				save = true;
			}

		// Add/Update
		}else {
			// Update
			if (found) {
				// Only update if different
				if (found.role !== role) {
					found.role = role;
					save = true;
				}

			// Add
			}else {
				(this.core.admins ?? (this.core.admins = [])).push({ did, role });
				save = true;
			}
		}

		// Only save if something changed
		if (save) {
			return this.save();
		}

		return false;
	}

	// #endregion

	// #region Channel actions

	public async addOrUpdateChannels(...channels: IChannelArgs[]): Promise<boolean> {
		channels.forEach(channel => {
			const found = this.getChannel(channel.did);
			if (found) {
				updateChannel(found, channel);
			} else {
				const cleanChannel = cleanJson({ ...channel } as IChannel, { deleteNull:true, deleteUndefined:true });
				(this.core.channels || (this.core.channels = [])).push(cleanChannel);
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
				this.core.channels = this.core.channels.filter(_channel => _channel.did !== channelDid);
			}
		});
		return this.core.channels.length !== count ? this.save() : false;
	}

	// #endregion

	// #region get

	public getAdmin(userDid: Snowflake): IAdminUser | undefined {
		return this.admins.find(admin => admin.did === userDid);
	}

	public getChannel(discordKey: DiscordKey): IChannel | undefined;
	public getChannel(channelDid: Optional<Snowflake>): IChannel | undefined;
	public getChannel(didOrKey: Optional<Snowflake> | DiscordKey): IChannel | undefined {
		if (didOrKey) {
			const did = typeof(didOrKey) === "string" ? didOrKey : didOrKey.channel;
			return this.channels.find(channel => channel.did === did);
		}
		return undefined;
	}

	public getRole(roleType: AdminRoleType): IAdminRole | undefined {
		return this.roles.find(role => role.type === roleType);
	}

	// #endregion

	// #region has

	/** Tests that we have an explicit setting for this admin. */
	public hasAdmin(userDid: Snowflake, roleType: AdminRoleType): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === roleType) !== undefined;
	}

	public hasChannel(discordKey: DiscordKey): boolean;
	public hasChannel(channelDid: Optional<Snowflake>): boolean;
	public hasChannel(didOrKey: Optional<Snowflake> | DiscordKey): boolean {
		return this.getChannel(didOrKey as DiscordKey) !== undefined;
	}

	/** Tests that we have a role for this type. */
	public hasRole(roleType: AdminRoleType): boolean {
		return this.roles.find(role => role.type === roleType) !== undefined;
	}

	// #endregion

	public async save(): Promise<boolean> {
		delete this._logLevel;
		//#region AdminRoleType change cleanup
		/** We use Discord perms for "ServerAdmin" and no longer have "SageAdmin". */
		this.core.admins = this.core.admins?.filter(admin => admin.role === AdminRoleType.GameAdmin);
		this.core.roles = this.core.roles?.filter(role => role.type === AdminRoleType.GameAdmin);
		//#endregion
		return this.sageCache.servers.write(this);
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

	public async update(opts: Args<TServerDefaultGameOptions>): Promise<boolean> {
		applyValues(this.core, opts);
		return this.save();
	}

	// #region IHasColorsCore

	public colors = new Colors(this.core.colors ?? (this.core.colors = []));

	public toDiscordColor(colorType: ColorType): string | null {
		if (!this.core.colors.length) {
			console.warn(`Colors Missing: Server (${this.discord?.guild?.name || this.id})`);
			return this.sageCache.bot.toDiscordColor(colorType);
		}
		return this.colors.toDiscordColor(colorType)
			|| this.sageCache.bot.toDiscordColor(colorType);
	}

	// #endregion

	// #region IHasEmoji

	public emoji = new Emoji(this.core.emoji ?? (this.core.emoji = []));

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
			did: guild.id,
			emoji: [],
			defaultCritMethodType: 0,
			defaultDialogType: DialogType.Embed,
			defaultDiceOutputType: DiceOutputType.M,
			defaultDicePostType: DicePostType.SinglePost,
			defaultDiceSecretMethodType: DiceSecretMethodType.Ignore,
			defaultGameType: GameType.None,
			defaultGmCharacterName: "Game Master",
			id: null!,
			logLevel: null!,
			name: guild.name,
			objectType: "Server",
			commandPrefix: activeBot.commandPrefix,
			roles: []
		};
	}

	public static HomeServerDid: Snowflake = "480488957889609733";

	public static isHome(serverDid: Snowflake): boolean {
		return serverDid === Server.HomeServerDid;
	}
}
