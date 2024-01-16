import { warn } from "@rsc-utils/console-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import type * as Discord from "discord.js";
import { GameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../sage-dice";
import { DiscordKey } from "../../discord";
import { DicePostType } from "../commands/dice";
import ActiveBot from "../model/ActiveBot";
import { DidCore, HasDidCore } from "../repo/base/DidRepository";
import { DialogType, IChannel, updateChannel } from "../repo/base/IdRepository";
import Colors from "./Colors";
import Emoji from "./Emoji";
import Game from "./Game";
import type { ColorType, IHasColors, IHasColorsCore } from "./HasColorsCore";
import type { EmojiType, IHasEmoji, IHasEmojiCore } from "./HasEmojiCore";

export type TAdminRoleType = keyof typeof AdminRoleType;
export enum AdminRoleType { Unknown = 0, GameAdmin = 1, ServerAdmin = 2, SageAdmin = 3 }
export interface IAdminRole { did: Discord.Snowflake; type: AdminRoleType; }
export interface IAdminUser { did: Discord.Snowflake; role: AdminRoleType; }

export interface ServerCore extends DidCore<"Server">, IHasColors, IHasEmoji {
	admins: IAdminUser[];
	channels: IChannel[];
	commandPrefix?: string;
	defaultCritMethodType?: CritMethodType;
	defaultDialogType?: DialogType;
	defaultDiceOutputType?: DiceOutputType;
	defaultDicePostType?: DicePostType;
	defaultDiceSecretMethodType?: DiceSecretMethodType;
	defaultGameType?: GameType;
	defaultGmCharacterName: string;
	name: string;
	roles: IAdminRole[];
}

export default class Server extends HasDidCore<ServerCore> implements IHasColorsCore, IHasEmojiCore {

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
	public get defaultGmCharacterName(): string { return this.core.defaultGmCharacterName; }
	public get discord() { return this.sageCache.discord; }
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
	public async findActiveGameByChannelDid(channelDid: Discord.Snowflake): Promise<Game | undefined> {
		return this.sageCache.games.findActiveByDiscordKey(new DiscordKey(this.did, channelDid));
	}
	public async addGame(channelDid: Discord.Snowflake, name: string, _gameType: Optional<GameType>, _dialogType: Optional<DialogType>, _critMethodType: Optional<CritMethodType>, _diceOutputType: Optional<DiceOutputType>, _dicePostType: Optional<DicePostType>, _diceSecretMethodType: Optional<DiceSecretMethodType>): Promise<boolean> {
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
			id: randomUuid(),
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
	public async addRole(roleType: AdminRoleType, roleDid: Discord.Snowflake): Promise<boolean> {
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
	public async updateRole(roleType: AdminRoleType, roleDid: Discord.Snowflake): Promise<boolean> {
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
	public async addAdmin(userDid: Discord.Snowflake, roleType: AdminRoleType): Promise<boolean> {
		const found = this.getAdmin(userDid);
		if (found) {
			return false;
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
	public async updateAdminRole(userDid: Discord.Snowflake, roleType: AdminRoleType): Promise<boolean> {
		const found = this.getAdmin(userDid);
		if (!found) {
			return false;
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
	public async removeAdmin(userDid: Discord.Snowflake): Promise<boolean> {
		const found = this.getAdmin(userDid);
		if (!found) {
			return false;
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
	public async addOrUpdateChannels(...channels: IChannel[]): Promise<boolean> {
		channels.forEach(channel => {
			const found = this.getChannel(channel.did);
			if (found) {
				updateChannel(found, channel);
			} else {
				(this.core.channels || (this.core.channels = [])).push({ ...channel });
			}
		});
		return this.save();
	}
	public async removeChannels(...channelDids: Optional<Discord.Snowflake>[]): Promise<boolean> {
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

	public getAdmin(userDid: Discord.Snowflake): IAdminUser | undefined {
		return this.admins.find(admin => admin.did === userDid);
	}

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
	public hasChannel(channelDid: Optional<Discord.Snowflake>): boolean;
	public hasChannel(didOrKey: Optional<Discord.Snowflake> | DiscordKey): boolean {
		return this.getChannel(didOrKey as DiscordKey) !== undefined;
	}

	/** Can admin anything Sage related. */
	public hasSageAdmin(userDid: Discord.Snowflake): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === AdminRoleType.SageAdmin) !== undefined;
	}

	/** Can admin only server options. */
	public hasServerAdmin(userDid: Discord.Snowflake): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === AdminRoleType.ServerAdmin) !== undefined;
	}

	/** Can admin only game options. */
	public hasGameAdmin(userDid: Discord.Snowflake): boolean {
		return this.admins.find(admin => admin.did === userDid && admin.role === AdminRoleType.GameAdmin) !== undefined;
	}

	// #endregion

	public async save(): Promise<boolean> {
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

	//#region update (defaultGame, defaultDiceOutput)
	public async update(gameType: Optional<GameType>, dialogType: Optional<DialogType>, critMethodType: Optional<CritMethodType>, diceOutputType: Optional<DiceOutputType>, dicePostType: Optional<DicePostType>, diceSecretMethodType: Optional<DiceSecretMethodType>): Promise<boolean> {
		this.core.defaultCritMethodType = critMethodType === null ? undefined : critMethodType ?? this.core.defaultCritMethodType;
		this.core.defaultDialogType = dialogType === null ? undefined : dialogType ?? this.core.defaultDialogType;
		this.core.defaultDiceOutputType = diceOutputType === null ? undefined : diceOutputType ?? this.core.defaultDiceOutputType;
		this.core.defaultDicePostType = dicePostType === null ? undefined : dicePostType ?? this.core.defaultDicePostType;
		this.core.defaultDiceSecretMethodType = diceSecretMethodType === null ? undefined : diceSecretMethodType ?? this.core.defaultDiceSecretMethodType;
		this.core.defaultGameType = gameType === null ? undefined : gameType ?? this.core.defaultGameType;
		return this.save();
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

	public toDiscordColor(colorType: ColorType): string | null {
		if (!this.core.colors.length) {
			warn(`Colors Missing: Server (${this.discord?.guild?.name ?? this.id})`);
			return this.sageCache.bot.toDiscordColor(colorType);
		}
		return this.colors.toDiscordColor(colorType)
			?? this.sageCache.bot.toDiscordColor(colorType);
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

	public static createCore(guild: Discord.Guild): ServerCore {
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
			name: guild.name,
			objectType: "Server",
			commandPrefix: activeBot.commandPrefix,
			roles: []
		};
	}

	public static HomeServerDid: Discord.Snowflake = "480488957889609733";
	public static isHome(serverDid: Discord.Snowflake): boolean {
		return serverDid === Server.HomeServerDid;
	}
}
