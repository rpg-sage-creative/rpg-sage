import type * as Discord from "discord.js";
import utils, { Optional } from "../../../sage-utils";
import { CritMethodType, DiceOutputType, DiceSecretMethodType, GameType, parseCritMethodType, parseDiceOutputType, parseGameType } from "../../../sage-dice";
import ArgsManager from "../../discord/ArgsManager";
import DiscordId from "../../discord/DiscordId";
import { DicePostType } from "../commands/dice";
import { PermissionType, type IChannel, type IChannelOptions, type TPermissionType } from "../repo/base/IdRepository";
import type { TColorAndType } from "./Colors";
import type { GameCharacterCore } from "./GameCharacter";
import { ColorType } from "./HasColorsCore";
import type SageMessage from "./SageMessage";
import type Server from "./Server";

export type TKeyValuePair = { key: string; value: string; };

type TArgIndexRet<T> = { arg: string; index: number; ret: T };

export type TNames = {
	charName?: string;
	oldName?: string;
	name?: string;
	newName?: string;
	count?: number;
};

// #region Args Manipulation

type TValidBooleanFlags = "admin" | "command" | "commands" | "dialog" | "dice" | "search";

/** /^(admin|commands?|dialog|dice|search)=(0|1|f|t|false|true)$/i */
function removeAndReturnBooleanFlag(args: string[], key: TValidBooleanFlags): boolean | undefined {
	const lower = key.toLowerCase().replace("commands", "command");
	const regex = /^(admin|commands?|dialog|dice|search)="(0|1|f|t|false|true)"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match && match[1].toLowerCase().replace("commands", "command") === lower) {
			args.splice(args.indexOf(arg), 1);
			return match[2] === "1" || match[2][0].toLowerCase() === "t";
		}
	}
	// server.updateChannel ignores arguments that are undefined
	return undefined;
}

type TValidTargetChannelFlags = "admin" | "command" | "commands" | "dialog" | "dice" | "search";

/** /^(admin|commands?|dialog|dice|search)(?:to)?=(\d{16,}|<#\d{16,}>)$/i */
function removeAndReturnChannelSnowflake(args: string[], key: TValidTargetChannelFlags): Discord.Snowflake | undefined {
	const lower = key.toLowerCase().replace("commands", "command");
	const regex = /^(admin|commands?|dialog|dice|search)(?:to)?="(\d{16,}|<#\d{16,}>)"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match && match[1].toLowerCase().replace("commands", "command") === lower) {
			args.splice(args.indexOf(arg), 1);
			return DiscordId.from(match[2])?.did ?? undefined;
		}
	}
	// server.updateChannel ignores arguments that are undefined
	return undefined;
}

/** /^(crit)=(TIMESTWO|ROLLTWICE|ADDMAX|UNSET)?$/i; returns null to unset */
function removeAndReturnCritMethodType(args: string[]): Optional<CritMethodType> {
	const regex = /^(crit)="(TIMESTWO|ROLLTWICE|ADDMAX|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			return parseCritMethodType(GameType.PF2e, match[2] ?? "") ?? null;
		}
	}
	return undefined;
}

/** /^(diceoutput)=(XXS|XS|S|M|XXL|XL|L|UNSET)?$/i; returns null to unset */
function removeAndReturnDiceOutputType(args: string[]): Optional<DiceOutputType> {
	const regex = /^(diceoutput)="(XXS|XS|S|M|XXL|XL|L|ROLLEM|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			return parseDiceOutputType(match[2] ?? "") ?? null;
		}
	}
	return undefined;
}

/** /^(dicepost)=(POST|SINGLEPOST|MULTI(PLE)?POSTS?|EMBED|SINGLEE?MBED|MULTI(PLE)?E?MBEDS?|UNSET)?$/i; returns null to unset */
function removeAndReturnDicePostType(args: string[]): Optional<DicePostType> {
	const regex = /^(dicepost)="(POST|SINGLEPOST|MULTI(PLE)?POSTS?|EMBED|SINGLEE?MBED|MULTI(PLE)?E?MBEDS?|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			const dicePostTypeString = (match[2] || "").toUpperCase();
			if (dicePostTypeString.match(/POSTS?$/)) {
				return dicePostTypeString.startsWith("MULTI") ? DicePostType.MultiplePosts : DicePostType.SinglePost;
			}
			if (dicePostTypeString.match(/EMBEDS?$/)) {
				return dicePostTypeString.startsWith("MULTI") ? DicePostType.MultipleEmbeds : DicePostType.SingleEmbed;
			}
			return null;
		}
	}
	return undefined;
}

/** /^(dicesecret)=(GAMEMASTER|GM|HIDE|IGNORE|UNSET)?$/i; returns null to unset */
function removeAndReturnDiceSecretMethodType(args: string[]): Optional<DiceSecretMethodType> {
	const regex = /^(dicesecret)="(GAMEMASTER|GM|DM|GMDM|DMGM|HIDE|IGNORE|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			const diceSecretMethodType = (match[2] || "").toUpperCase();
			if (["DM","DMGM","GMDM"].includes(diceSecretMethodType)) {
				return DiceSecretMethodType.GameMasterDirect;
			}
			if (["GM","GAMEMASTER"].includes(diceSecretMethodType)) {
				return DiceSecretMethodType.GameMasterChannel;
			}
			if (diceSecretMethodType === "HIDE") {
				return DiceSecretMethodType.Hide;
			}
			if (diceSecretMethodType === "IGNORE") {
				return DiceSecretMethodType.Ignore;
			}
			return null;
		}
	}
	return undefined;
}

/** /^(game)=(PF1E|PF1|PF2E|PF2|PF|SF1E|SF1|SF|DND5E|5E|QUEST|NONE)?$/i */
function removeAndReturnGameType(args: string[]): GameType | undefined {
	const regex = /^(game)="(ESSENCE20|ESS20|E20|PF1E|PF1|PF2E|PF2|PF|SF1E|SF1|SF|DND5E|5E|QUEST|NONE)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			return parseGameType(match[2] ?? "");
		}
	}
	return undefined;
}

function removeAndReturnPermissionType(args: string[], key: "gamemaster" | "nonplayer" | "player"): PermissionType | undefined {
	const regex = /^(gm|gamemaster|player|nonplayer)s?="(?:(0|1|2|3)|(none|read|react|write))"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match && match[1].toLowerCase().replace(/^gm$/, "gamemaster") === key) {
			args.splice(args.indexOf(arg), 1);
			return match[3] ? PermissionType[<TPermissionType>utils.StringUtils.capitalize(match[3])] : +match[2];
		}
	}
	// game.updateChannel ignores arguments that are undefined
	return undefined;
}

// #endregion

export default class SageMessageArgsManager extends ArgsManager {
	public constructor(protected sageMessage: SageMessage, argsManager: ArgsManager) {
		super(argsManager ?? []);
	}

	private attachments?: Discord.Collection<Discord.Snowflake, Discord.MessageAttachment>;
	public removeAndReturnAttachmentUrl(): string | undefined {
		const attachments = this.attachments ?? (this.attachments = this.sageMessage.message.attachments.clone());
		if (attachments.size) {
			const first = attachments.first();
			attachments.delete(<string>attachments.firstKey());
			return first!.url;
		}
		return this.removeAndReturnUrl();
	}

	protected async findChannelIndexWithDid(): Promise<TArgIndexRet<Discord.Snowflake> | undefined> {
		if (this.isEmpty) {
			return undefined;
		}

		return <Promise<TArgIndexRet<Discord.Snowflake> | undefined>>this.asyncFindArgIndexRet(async arg =>
			DiscordId.isChannelReference(arg) ? DiscordId.parseId(arg)
			: DiscordId.isValidId(arg) ? (await this.sageMessage.discord.fetchChannel(arg))?.id
			: undefined
		);
	}
	public async removeAndReturnChannelDid(): Promise<Discord.Snowflake | null>;
	public async removeAndReturnChannelDid(defaultThisChannel: false): Promise<Discord.Snowflake | null>;
	public async removeAndReturnChannelDid(defaultThisChannel: true): Promise<Discord.Snowflake>;
	public async removeAndReturnChannelDid(defaultThisChannel = false): Promise<Discord.Snowflake | null> {
		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			this.removeByArgAndIndex(withIndex);
			return withIndex.ret;
		}
		return defaultThisChannel ? this.sageMessage.threadOrChannelDid : null;
	}

	public removeAndReturnChannelOptions(): IChannelOptions | null {
		const channelOptions: IChannelOptions = {
			admin: removeAndReturnBooleanFlag(this, "admin"),
			commands: removeAndReturnBooleanFlag(this, "commands"),
			defaultCritMethodType: removeAndReturnCritMethodType(this)!,
			defaultDiceOutputType: removeAndReturnDiceOutputType(this)!,
			defaultDicePostType: removeAndReturnDicePostType(this)!,
			defaultDiceSecretMethodType: removeAndReturnDiceSecretMethodType(this)!,
			defaultGameType: removeAndReturnGameType(this),
			dialog: removeAndReturnBooleanFlag(this, "dialog"),
			dice: removeAndReturnBooleanFlag(this, "dice"),
			gameMaster: removeAndReturnPermissionType(this, "gamemaster"),
			nonPlayer: removeAndReturnPermissionType(this, "nonplayer"),
			player: removeAndReturnPermissionType(this, "player"),
			search: removeAndReturnBooleanFlag(this, "search"),
			sendCommandTo: removeAndReturnChannelSnowflake(this, "command"),
			sendDialogTo: removeAndReturnChannelSnowflake(this, "dialog"),
			sendDiceTo: removeAndReturnChannelSnowflake(this, "dice"),
			sendSearchTo: removeAndReturnChannelSnowflake(this, "search")
		};
		if (!Object.keys(channelOptions).find(key => channelOptions[<keyof IChannelOptions>key] !== undefined)) {
			return null;
		}
		return channelOptions;
	}

	public removeAndReturnCharacterOptions(names: TNames, userDid?: Discord.Snowflake): GameCharacterCore {
		const characterCore: GameCharacterCore = {
			autoChannels: undefined,
			avatarUrl: this.removeAndReturnUrl("avatar")!,
			companions: undefined,
			embedColor: this.removeAndReturnDiscordColor("color")!,
			id: undefined!,
			tokenUrl: this.removeAndReturnUrl("token")!,
			name: names.newName ?? names.name!,
			userDid: userDid ?? undefined
		};
		if (characterCore.tokenUrl === undefined) {
			characterCore.tokenUrl = this.removeAndReturnAttachmentUrl();
		}
		if (characterCore.avatarUrl === undefined) {
			characterCore.avatarUrl = this.removeAndReturnAttachmentUrl();
		}
		return characterCore;
	}

	public removeAndReturnColorAndType(): TColorAndType | null {
		if (this.isEmpty) {
			return null;
		}
		//TODO: find them separately before removing them
		const color = this.removeAndReturnColor(),
			type = this.removeAndReturnEnum<ColorType>(ColorType);
		if (color && type) {
			return { color: color, type: type };
		}
		return null;
	}

	public removeAndReturnCritMethodType(): Optional<CritMethodType> {
		return removeAndReturnCritMethodType(this);
	}

	public removeAndReturnDiceOutputType(): Optional<DiceOutputType> {
		return removeAndReturnDiceOutputType(this);
	}

	public removeAndReturnDicePostType(): Optional<DicePostType> {
		return removeAndReturnDicePostType(this);
	}

	public removeAndReturnDiceSecretMethodType(): Optional<DiceSecretMethodType> {
		return removeAndReturnDiceSecretMethodType(this);
	}

	public removeAndReturnDiscordColor(argKey?: string): Optional<string> {
		if (argKey) {
			const color = this.removeByKey(argKey);
			// return appropriate null or undefined
			if (typeof(color) !== "string") {
				return color;
			}
			// return valid color or null
			return utils.ColorUtils.Color.isValid(color)
				? utils.ColorUtils.Color.from(color).toDiscordColor()
				: null;
		}
		return this.removeAndReturnColor()?.toDiscordColor();
	}

	public async removeAndReturnGameChannel(): Promise<IChannel | null> {
		const game = this.sageMessage.game;
		if (!game) {
			return null;
		}

		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			const channel = game.getChannel(withIndex.ret);
			if (channel) {
				this.removeByArgAndIndex(withIndex);
				return channel;
			}
		}

		return game.getChannel(this.sageMessage.channelDid) ?? null;
	}

	public removeAndReturnGameType(): GameType | undefined {
		return removeAndReturnGameType(this);
	}

	public removeAndReturnName(defaultJoinRemaining = false, defaultJoinSeparator = " "): string | undefined {
		const keyValue = this.removeKeyValuePair("name");
		if (keyValue) {
			return keyValue.value ?? undefined;
		}

		const notKeyValue = this.findArgIndexNonArgs().shift();
		if (notKeyValue) {
			this.removeAt(notKeyValue.index);
			return notKeyValue.arg;
		}

		if (defaultJoinRemaining) {
			const name = this.removeAndReturnNonArgs()
				.map(withIndex => withIndex.arg)
				.join(defaultJoinSeparator)
				.trim();
			return name === "" ? undefined : name;
		}

		return undefined;
	}

	public removeAndReturnNames(defaultJoinRemaining = false, defaultJoinSeparator = " "): TNames {
		const names = <TNames>{
			charName: this.removeByKey("charName"),
			oldName: this.removeByKey("oldName"),
			name: this.removeByKey("name"),
			newName: this.removeByKey("newName"),
			count: 0
		};
		names.count = (names.charName ? 1 : 0) + (names.oldName ? 1 : 0) + (names.name ? 1 : 0) + (names.newName ? 1 : 0);
		if (!names.count) {
			names.name = this.removeAndReturnName(defaultJoinRemaining, defaultJoinSeparator);
		}
		return names;
	}

	public async removeAndReturnRoleDid(): Promise<Discord.Snowflake | null> {
		if (this.isEmpty) {
			return null;
		}

		const roleDid = await this.asyncFindArgAndRemoveAndMap<Discord.Snowflake | undefined>(async arg =>
			DiscordId.isRoleMention(arg) ? DiscordId.parseId(arg)
			: DiscordId.isValidId(arg) ? (await this.sageMessage.discord.fetchGuildRole(arg))?.id
			: undefined
		);

		return roleDid ?? null;
	}

	public async removeAndReturnServer(): Promise<Optional<Server>> {
		if (this.isEmpty) {
			return null;
		}

		const servers = this.sageMessage.caches.servers;

		const server = await this.asyncFindArgAndRemoveAndMap<Optional<Server>>(async arg =>
			utils.UuidUtils.isValid(arg) ? servers.getById(arg)
			: DiscordId.isValidId(arg) ? servers.getByDid(arg)
			: undefined
		);

		return server ?? null;
	}

	public async removeAndReturnServerChannel(): Promise<IChannel | null> {
		const server = this.sageMessage.server;
		if (!server) {
			return null;
		}

		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			const channel = server.getChannel(withIndex.ret);
			if (channel) {
				this.removeAt(withIndex.index);
				return channel;
			}
		}

		return server.getChannel(this.sageMessage.discordKey) ?? null;
	}

	// public async removeAndReturnUserDids(): Promise<Discord.Snowflake[]> {
	// 	const users = this.sageMessage.message.mentions.users.array();
	// 	const userDids = users.map(user => <Discord.Snowflake>user.id);
	// 	let userDid: Discord.Snowflake;
	// 	while (userDid = await this.removeAndReturnUserDid()) {
	// 		userDids.push(userDid);
	// 	}
	// 	return userDids.filter(utils.ArrayUtils.Filters.unique);
	// }
	public async removeAndReturnUserDid(argKey?: string, defaultIfNoArg = true): Promise<Discord.Snowflake | null> {
		if (this.isEmpty) {
			return null;
		}

		const discord = this.sageMessage.caches.discord;
		const userRepo = this.sageMessage.caches.users;

		let userDid: Optional<Discord.Snowflake>;
		if (argKey && this.findKeyValueArgIndex(argKey)) {
			userDid = await argToSnowflake(this.removeByKey(argKey)!);
		}
		if (!userDid && defaultIfNoArg) {
			userDid = await this.asyncFindArgAndRemoveAndMap<Discord.Snowflake | undefined>(async arg => argToSnowflake(arg));
		}
		return userDid ?? null;

		async function argToSnowflake(arg: string): Promise<Discord.Snowflake | undefined> {
			return DiscordId.isUserMention(arg) ? DiscordId.parseId(arg)
				: utils.UuidUtils.isValid(arg) ? (await userRepo.getById(arg))?.did
				: DiscordId.isValidId(arg) ? (await discord.fetchGuildMember(arg))?.id
				: undefined;
		}
	}

}
