import type * as Discord from "discord.js";
import { GameType, parseGameType } from "../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType, parseCritMethodType, parseDiceOutputType } from "../../../sage-dice";
import type { Optional, VALID_UUID } from "../../../sage-utils";
import { EnumUtils } from "../../../sage-utils/utils";
import { ArgsManager } from "../../../sage-utils/utils/ArgsUtils";
import { Color } from "../../../sage-utils/utils/ColorUtils";
import { capitalize } from "../../../sage-utils/utils/StringUtils";
import { isValid as isValidUuid } from "../../../sage-utils/utils/UuidUtils";
import DiscordId from "../../discord/DiscordId";
import { DicePostType } from "../commands/dice";
import { DialogType, GameChannelType, PermissionType, channelTypeToChannelOptions, parseChannelType, type IChannel, type IChannelOptions, type TPermissionType } from "../repo/base/channel";
import type { TColorAndType } from "./Colors";
import type { GameCharacterCore } from "./GameCharacter";
import { ColorType } from "./HasColorsCore";
import type { ISageCommandArgs } from "./SageCommand";
import type SageMessage from "./SageMessage";
import type Server from "./Server";

type TArgIndexRet<T> = { arg: string; index: number; ret: T };

export type TNames = {
	charName?: string;
	oldName?: string;
	name?: string;
	newName?: string;
	count?: number;
};

export default class SageMessageArgs extends ArgsManager implements ISageCommandArgs {
	public constructor(protected sageMessage: SageMessage, argsManager: ArgsManager) {
		super(...(argsManager ?? []));
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

	//#region ISageCommandArgs

	/** Gets the named option as a boolean or null */
	public getBoolean(name: string): boolean | null;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string): boolean | null {
		const value = this.getString(name);
		if (value !== null) {
			if (value.match(/^(t|y|1|true|yes)$/i)) {
				return true;
			}
			if (value.match(/^(f|n|0|false|no)$/i)) {
				return false;
			}
		}
		return null;
	}
	/** Returns true if the argument was given a value. */
	public hasBoolean(name: string): boolean {
		return this.getBoolean(name) !== null;
	}

	/** Gets the named option as a GuildBasedChannel or null */
	public getChannel(name: string): Discord.GuildBasedChannel | null;
	/** Gets the named option as a GuildBasedChannel */
	public getChannel(name: string, required: true): Discord.GuildBasedChannel;
	/** @todo don't always return null */
	public getChannel(): Discord.GuildBasedChannel | null {
		return null;
	}
	/** Returns true if the argument was given a value. */
	public hasChannel(name: string): boolean {
		return this.getChannel(name) !== null;
	}

	/** Gets the named option as a GuildBasedChannel or null */
	public getChannelDid(name: string): Discord.Snowflake | null;
	/** Gets the named option as a GuildBasedChannel */
	public getChannelDid(name: string, required: true): Discord.Snowflake;
	public getChannelDid(name: string): Discord.Snowflake | null {
		const value = this.getString(name);
		if (value !== null) {
			if (DiscordId.isValidId(value)) {
				return value;
			}
			if (DiscordId.isChannelReference(value)) {
				return DiscordId.parseId(value);
			}
		}
		return null;
	}
	/** Returns true if the argument was given a value. */
	public hasChannelDid(name: string): boolean {
		return this.getChannelDid(name) !== null;
	}

	/** Gets the named option as a value from the given enum type or null if not valid */
	public getEnum<U>(type: any, name: string): U | null;
	/** Gets the named option as a string */
	public getEnum<U>(type: any, name: string, required: true): U;
	public getEnum<U>(type: any, name: string): U | null {
		const str = this.getString(name);
		if (str !== null) {
			const value = EnumUtils.parse<U>(type, str);
			if (value !== undefined) {
				return value;
			}
		}
		return null;
	}
	/** Returns true if the argument was given a value. */
	public hasEnum(type: any, name: string): boolean {
		return this.getEnum(type, name) !== null;
	}

	/** Gets the named option as a number or null */
	public getNumber(name: string): number | null;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string): number | null {
		const str = this.getString(name);
		const num = +str!;
		return isNaN(num) ? null : num;
	}
	/** Returns true if the argument was given a value. */
	public hasNumber(name: string): boolean {
		return this.getNumber(name) !== null;
	}

	/** Gets the named option as a string or null */
	public getString<U extends string = string>(name: string): U | null;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string): string | null {
		return this.findKeyValueArgIndex(name)?.ret?.value ?? null;
	}
	/** Returns true if the argument was given a value. */
	public hasString(name: string): boolean {
		return this.getString(name) !== null;
	}

	/** Returns true if the argument was given the value "unset". */
	public hasUnset(name: string): boolean {
		return this.getString(name)?.trim().toLowerCase() === "unset";
	}

	/** Gets the named option as a VALID_UUID or null */
	public getUuid(name: string): VALID_UUID | null;
	/** Gets the named option as a VALID_UUID */
	public getUuid(name: string, required: true): VALID_UUID;
	public getUuid(name: string): VALID_UUID | null {
		const str = this.getString(name);
		return isValidUuid(str) ? str : null;
	}
	/** Returns true if the argument was given a VALID_UUID value. */
	public hasUuid(name: string): boolean {
		return this.getUuid(name) !== null;
	}
	//#endregion

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

	/**
	 * /^(admin|commands?|dialog|dice|search)=(0|1|f|t|false|true)$/i;
	 * returns undefined if not found.
	 */
	public removeAndReturnBooleanFlag(arg: "admin" | "commands" | "dialog" | "dice" | "search"): boolean | undefined {
		const q = arg === "commands" ? "?" : "";
		const keyRegex = new RegExp(arg + q, "i");
		const valueRegex = /0|1|f|t|false|true/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			return ["1","t"].includes(keyValuePair.value[0].toLowerCase());
		}
		return undefined;
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
		return defaultThisChannel ? this.sageMessage.discordKey.threadOrChannel ?? null : null;
	}

	public removeAndReturnChannelOptions(): IChannelOptions | null {
		const gameChannelType = this.removeAndReturnChannelType();
		const channelTypeOptions = channelTypeToChannelOptions(gameChannelType);
		const channelOptions: IChannelOptions = {
			admin: channelTypeOptions.admin ?? this.removeAndReturnBooleanFlag("admin"),
			commands: channelTypeOptions.commands ?? this.removeAndReturnBooleanFlag("commands"),
			defaultDialogType: this.removeAndReturnDialogType()!,
			defaultCritMethodType: this.removeAndReturnCritMethodType()!,
			defaultDiceOutputType: this.removeAndReturnDiceOutputType()!,
			defaultDicePostType: this.removeAndReturnDicePostType()!,
			defaultDiceSecretMethodType: this.removeAndReturnDiceSecretMethodType()!,
			defaultGameType: this.removeAndReturnGameType()!,
			dialog: channelTypeOptions.dialog ?? this.removeAndReturnBooleanFlag("dialog"),
			dice: channelTypeOptions.dice ?? this.removeAndReturnBooleanFlag("dice"),
			gameChannelType: gameChannelType ?? undefined,
			gameMaster: channelTypeOptions.gameMaster ?? this.removeAndReturnPermissionType("gamemaster"),
			nonPlayer: channelTypeOptions.nonPlayer ?? this.removeAndReturnPermissionType("nonplayer"),
			player: channelTypeOptions.player ?? this.removeAndReturnPermissionType("player"),
			search: channelTypeOptions.search ?? this.removeAndReturnBooleanFlag("search"),
			sendCommandTo: this.removeAndReturnChannelSnowflake("commands"),
			sendDialogTo: this.removeAndReturnChannelSnowflake("dialog"),
			sendDiceTo: this.removeAndReturnChannelSnowflake("dice"),
			sendSearchTo: this.removeAndReturnChannelSnowflake("search")
		};
		if (!Object.keys(channelOptions).find(key => channelOptions[<keyof IChannelOptions>key] !== undefined)) {
			return null;
		}
		return channelOptions;
	}

	/**
	 * /^(admin|commands?|dialog|dice|search)(?:to)?=(\d{16,}|<#\d{16,}>)$/i;
	 * returns undefined if not found.
	 */
	public removeAndReturnChannelSnowflake(arg: "admin" | "commands" | "dialog" | "dice" | "search"): Discord.Snowflake | undefined {
		const q = arg === "commands" ? "?" : "";
		const keyRegex = new RegExp(`${arg}${q}(to)?`, "i");
		/** @todo confirm this regex for snowflakes */
		const valueRegex = /\d{16,}|<#\d{16,}>/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			/** @todo return null if parsing failed for some reason? */
			return DiscordId.from(keyValuePair.value)?.did ?? undefined;
		}
		return undefined;
	}

	/**
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnChannelType(): Optional<GameChannelType> {
		const keyRegex = /(channel)?type/i;
		const valueRegex = /IC|OOC|GM|MISC|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			return parseChannelType(keyValuePair.value) ?? null;
		}
		return undefined;
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

	/**
	 * /^((dice)?crit(method)?(type)?)=(TIMESTWO|ROLLTWICE|ADDMAX|UNSET)$/i;
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnCritMethodType(): Optional<CritMethodType> {
		const keyRegex = /(dice)?crit(method)?(type)?/i;
		const valueRegex = /TIMESTWO|ROLLTWICE|ADDMAX|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			return parseCritMethodType(GameType.PF2e, keyValuePair.value) ?? null;
		}
		return undefined;
	}

	/**
	 * /^(dialogtype)=(EMBED|POST|UNSET)$/i;
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnDialogType(): Optional<DialogType> {
		const keyRegex = /dialogtype/i;
		const valueRegex = /EMBED|POST|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			const dialogTypeString = keyValuePair.value.toUpperCase();
			if (dialogTypeString === "EMBED") {
				return DialogType.Embed;
			}
			if (dialogTypeString === "POST") {
				return DialogType.Post;
			}
			return null;
		}
		return undefined;
	}

	/**
	 * /^(sageposttype)=(EMBED|POST|UNSET)$/i;
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnSagePostType(): Optional<DialogType> {
		const keyRegex = /sageposttype/i;
		const valueRegex = /EMBED|POST|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			const dialogTypeString = keyValuePair.value.toUpperCase();
			if (dialogTypeString === "EMBED") {
				return DialogType.Embed;
			}
			if (dialogTypeString === "POST") {
				return DialogType.Post;
			}
			return null;
		}
		return undefined;
	}

	/**
	 * /^(diceoutput)=(XXS|XS|S|M|XXL|XL|L|UNSET)$/i;
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnDiceOutputType(): Optional<DiceOutputType> {
		const keyRegex = /diceoutput/i;
		const valueRegex = /XXS|XS|S|M|XXL|XL|L|ROLLEM|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			return parseDiceOutputType(keyValuePair.value) ?? null;
		}
		return undefined;
	}

	/**
	 * /^(dicepost)=(POST|SINGLEPOST|MULTI(PLE)?POSTS?|EMBED|SINGLEE?MBED|MULTI(PLE)?E?MBEDS?|UNSET)$/i;
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnDicePostType(): Optional<DicePostType> {
		const keyRegex = /dicepost/i;
		const valueRegex = /POST|SINGLEPOST|MULTI(PLE)?POSTS?|EMBED|SINGLEE?MBED|MULTI(PLE)?E?MBEDS?|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			const dicePostTypeString = (keyValuePair.value ?? "").toUpperCase();
			if (dicePostTypeString.match(/POSTS?$/)) {
				return dicePostTypeString.startsWith("MULTI") ? DicePostType.MultiplePosts : DicePostType.SinglePost;
			}
			if (dicePostTypeString.match(/EMBEDS?$/)) {
				return dicePostTypeString.startsWith("MULTI") ? DicePostType.MultipleEmbeds : DicePostType.SingleEmbed;
			}
			return null;
		}
		return undefined;
	}

	/**
	 * /^(dicesecret)=(GAMEMASTER|GM|HIDE|IGNORE|UNSET)?$/i;
	 * returns undefined if not found.
	 * returns null to unset
	 */
	public removeAndReturnDiceSecretMethodType(): Optional<DiceSecretMethodType> {
		const keyRegex = /dicesecret/i;
		const valueRegex = /GAMEMASTER|GM|DM|GMDM|DMGM|HIDE|IGNORE|UNSET/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			const diceSecretMethodType = (keyValuePair.value ?? "").toUpperCase();
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
		return undefined;
	}

	public removeAndReturnDiscordColor(argKey?: string): Optional<string> {
		if (argKey) {
			const color = this.removeByKey(argKey);
			// return appropriate null or undefined
			if (typeof(color) !== "string") {
				return color;
			}
			// return valid color or null
			return Color.isValid(color)
				? Color.from(color).toDiscordColor()
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

		return game.getChannel(this.sageMessage.discordKey.channel) ?? null;
	}

	/**
	 * /^(gamesystem|gametype|game|system|type)=(ESSENCE20|ESS20|E20|PF1E|PF1|PF2E|PF2|PF|SF1E|SF1|SF|DND5E|5E|QUEST|NONE|UNSET)?$/i;
	 * returns undefined if not found.
	 * returns null to unset.
	 */
	public removeAndReturnGameType(): Optional<GameType> {
		const keyRegex = /gamesystem|gametype|game|system|type/i
		const valueRegex = /ESSENCE20|ESS20|E20|PF1E|PF1|PF2E|PF2|PF|SF1E|SF1|SF|DND5E|5E|QUEST|NONE|UNSET/i
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			return parseGameType(keyValuePair.value ?? "") ?? null;
		}
		return undefined;
	}

	public removeAndReturnName(defaultJoinRemaining = false, defaultJoinSeparator = " "): string | undefined {
		const keyValue = this.removeKeyValuePair("name");
		if (keyValue) {
			return keyValue.value ?? undefined;
		}

		/** @todo look into this change */
		// const notKeyValue = this.findArgIndexRet(arg => !arg.match(/^\w+=.*$/i) && arg.match(/\s/));
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
			names.count = names.name ? 1 : 0;
		}
		return names;
	}

	/**
	 * /^(gm|gamemaster|player|nonplayer)s?=(?:(0|1|2|3)|(none|read|react|write))$/i;
	 * returns undefined if not found.
	 */
	public removeAndReturnPermissionType(key: "gamemaster" | "nonplayer" | "player"): PermissionType | undefined {
		const orGm = key === "gamemaster" ? "|gm" : "";
		const keyRegex = new RegExp(key + orGm, "i");
		const valueRegex = /0|1|2|3|none|read|react|write/i;
		const keyValuePair = this.removeKeyValuePair(keyRegex, valueRegex);
		if (keyValuePair) {
			return "0123".includes(keyValuePair.value)
				? +keyValuePair.value
				: PermissionType[capitalize(keyValuePair.value) as TPermissionType];
		}
		return undefined;
	}

	public async removeAndReturnRoleDid(): Promise<Discord.Snowflake | null> {
		if (this.isEmpty) {
			return null;
		}

		const roleDid = await this.asyncFindArgAndRemoveAndMap<Discord.Snowflake | undefined>(async arg => {
			if (DiscordId.isRoleMention(arg)) {
				return DiscordId.parseId(arg);
			}
			return DiscordId.isValidId(arg)
				? (await this.sageMessage.discord.fetchGuildRole(arg))?.id
				: undefined;
		});

		return roleDid ?? null;
	}

	public async removeAndReturnServer(): Promise<Optional<Server>> {
		if (this.isEmpty) {
			return null;
		}

		const servers = this.sageMessage.sageCache.servers;

		const server = await this.asyncFindArgAndRemoveAndMap<Optional<Server>>(async arg =>
			isValidUuid(arg) ? servers.getById(arg)
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

		const discord = this.sageMessage.sageCache.discord;
		const userRepo = this.sageMessage.sageCache.users;

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
				: isValidUuid(arg) ? (await userRepo.getById(arg))?.did
				: DiscordId.isValidId(arg) ? (await discord.fetchGuildMember(arg))?.id
				: undefined;
		}
	}

}
