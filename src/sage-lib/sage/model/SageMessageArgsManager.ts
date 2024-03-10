import { Color } from "@rsc-utils/color-utils";
import { parseId, parseIds } from "@rsc-utils/discord-utils";
import { parseEnum } from "@rsc-utils/enum-utils";
import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/snowflake-utils";
import { capitalize, isNotBlank } from "@rsc-utils/string-utils";
import { isDefined, type Optional } from "@rsc-utils/type-utils";
import { UUID, isNonNilUuid, isUuid } from "@rsc-utils/uuid-utils";
import type { Collection, GuildBasedChannel, MessageAttachment, Role } from "discord.js";
import { GameType, parseGameType } from "../../../sage-common/index.js";
import { CritMethodType, DiceOutputType, DiceSecretMethodType, parseCritMethodType, parseDiceOutputType } from "../../../sage-dice/index.js";
import { ArgsManager } from "../../discord/ArgsManager.js";
import { DicePostType } from "../commands/dice.js";
import { DialogType, PermissionType, type IChannel, type IChannelOptions, type TPermissionType } from "../repo/base/IdRepository.js";
import type { TColorAndType } from "./Colors.js";
import type { GameCharacterCore } from "./GameCharacter.js";
import { ColorType } from "./HasColorsCore.js";
import { EnumLike, SageCommandArgs } from "./SageCommandArgs.js";
import type { SageMessage } from "./SageMessage.js";
import type { Server } from "./Server.js";

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
function removeAndReturnChannelSnowflake(args: string[], key: TValidTargetChannelFlags): Snowflake | undefined {
	const lower = key.toLowerCase().replace("commands", "command");
	const regex = /^(admin|commands?|dialog|dice|search)(?:to)?="(\d{16,}|<#\d{16,}>|https:\/\/discord\.com\/channels\/\d{16,}\/\d{16,})"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match && match[1].toLowerCase().replace("commands", "command") === lower) {
			args.splice(args.indexOf(arg), 1);
			return parseId(match[2], "channel") ?? undefined;
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

type TChannelType = "IC" | "OOC" | "GM" | "MISC";
function removeAndReturnChannelType(args: string[]): Optional<TChannelType> {
	const regex = /^((?:channel)?type)="(IC|OOC|GM|MISC|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			return match[2]?.toUpperCase() as TChannelType ?? null;
		}
	}
	return undefined;
}
function trueFalseUndefined(channelType: Optional<TChannelType>, trueList: TChannelType[], falseList: TChannelType[]): boolean | undefined {
	if (trueList.includes(channelType!)) {
		return true;
	}
	if (falseList.includes(channelType!)) {
		return false;
	}
	return undefined;
}
function writeNoneUndefined(channelType: Optional<TChannelType>, writeList: TChannelType[], noneList: TChannelType[]): PermissionType | undefined {
	if (writeList.includes(channelType!)) {
		return PermissionType.Write;
	}
	if (noneList.includes(channelType!)) {
		return PermissionType.None;
	}
	return undefined;
}
function channelTypeToChannelOptions(channelType: Optional<TChannelType>): IChannelOptions {
	return {
		admin: trueFalseUndefined(channelType, ["IC", "OOC", "GM", "MISC"], []),
		commands: trueFalseUndefined(channelType, ["OOC", "GM", "MISC"], ["IC"]),
		dialog: trueFalseUndefined(channelType,["IC", "OOC", "GM", "MISC"], []),
		dice: trueFalseUndefined(channelType, ["IC", "OOC", "GM", "MISC"], []),
		search: trueFalseUndefined(channelType, ["OOC", "GM", "MISC"], ["IC"]),

		gameMaster: writeNoneUndefined(channelType, ["IC", "OOC", "GM", "MISC"], []),
		nonPlayer: writeNoneUndefined(channelType, [], ["IC", "OOC", "GM", "MISC"]),
		player: writeNoneUndefined(channelType, ["IC", "OOC", "MISC"], ["GM"])
	};
}

function removeAndReturnDialogType(args: string[]): Optional<DialogType> {
	const regex = /^(dialogtype)="(EMBED|POST|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			const dialogTypeString = (match[2] ?? "").toUpperCase();
			if (dialogTypeString === "EMBED") {
				return DialogType.Embed;
			}
			if (dialogTypeString === "POST") {
				return DialogType.Post;
			}
			return null;
		}
	}
	return undefined;
}
function removeAndReturnSagePostType(args: string[]): Optional<DialogType> {
	const regex = /^(sageposttype)="(EMBED|POST|UNSET)?"$/i;
	for (const arg of args) {
		const match = arg.match(regex);
		if (match) {
			args.splice(args.indexOf(arg), 1);
			const dialogTypeString = (match[2] ?? "").toUpperCase();
			if (dialogTypeString === "EMBED") {
				return DialogType.Embed;
			}
			if (dialogTypeString === "POST") {
				return DialogType.Post;
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

/** /^(game)=(PF1E|PF1|PF2E|PF2|PF|SF1E|SF1|SF|DND5E|QUEST|VTM5E|NONE)?$/i */
function removeAndReturnGameType(args: string[]): GameType | undefined {
	const regex = /^(gamesystem|gametype|game|system|type)="(ESSENCE20|ESS20|E20|PF1E|PF1|PF2E|PF2|PF|SF1E|SF1|SF|DND5E|QUEST|CNC|VTM5E|VTM5|NONE)?"$/i;
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
			return match[3] ? PermissionType[<TPermissionType>capitalize(match[3])] : +match[2];
		}
	}
	// game.updateChannel ignores arguments that are undefined
	return undefined;
}

// #endregion

export class SageMessageArgsManager extends ArgsManager implements SageCommandArgs {
	public constructor(protected sageMessage: SageMessage, argsManager: ArgsManager) {
		super(argsManager ?? []);
	}

	//#region Old

	private attachments?: Collection<Snowflake, MessageAttachment>;
	public removeAndReturnAttachmentUrl(): string | undefined {
		const attachments = this.attachments ?? (this.attachments = this.sageMessage.message.attachments.clone());
		if (attachments.size) {
			const first = attachments.first();
			attachments.delete(<string>attachments.firstKey());
			return first!.url;
		}
		return this.removeAndReturnUrl();
	}

	protected async findChannelIndexWithDid(): Promise<TArgIndexRet<Snowflake> | undefined> {
		if (this.isEmpty) {
			return undefined;
		}

		return <Promise<TArgIndexRet<Snowflake> | undefined>>this.asyncFindArgIndexRet(async arg => {
			const did = isNonNilSnowflake(arg) ? arg : parseId(arg, "channel");
			if (did) {
				const channel = await this.sageMessage.discord.fetchChannel(did);
				return channel?.id;
			}
			return undefined;
		});
	}
	public async removeAndReturnChannelDid(): Promise<Snowflake | null>;
	public async removeAndReturnChannelDid(defaultThisChannel: false): Promise<Snowflake | null>;
	public async removeAndReturnChannelDid(defaultThisChannel: true): Promise<Snowflake>;
	public async removeAndReturnChannelDid(defaultThisChannel = false): Promise<Snowflake | null> {
		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			this.removeByArgAndIndex(withIndex);
			return withIndex.ret;
		}
		return defaultThisChannel ? this.sageMessage.threadOrChannelDid : null;
	}

	public removeAndReturnChannelOptions(): IChannelOptions | null {
		const channelType = removeAndReturnChannelType(this);
		const channelTypeOptions = channelTypeToChannelOptions(channelType);
		const channelOptions: IChannelOptions = {
			admin: channelTypeOptions.admin ?? removeAndReturnBooleanFlag(this, "admin"),
			commands: channelTypeOptions.commands ?? removeAndReturnBooleanFlag(this, "commands"),
			defaultDialogType: removeAndReturnDialogType(this)!,
			defaultCritMethodType: removeAndReturnCritMethodType(this)!,
			defaultDiceOutputType: removeAndReturnDiceOutputType(this)!,
			defaultDicePostType: removeAndReturnDicePostType(this)!,
			defaultDiceSecretMethodType: removeAndReturnDiceSecretMethodType(this)!,
			defaultGameType: removeAndReturnGameType(this),
			dialog: channelTypeOptions.dialog ?? removeAndReturnBooleanFlag(this, "dialog"),
			dice: channelTypeOptions.dice ?? removeAndReturnBooleanFlag(this, "dice"),
			gameMaster: channelTypeOptions.gameMaster ?? removeAndReturnPermissionType(this, "gamemaster"),
			nonPlayer: channelTypeOptions.nonPlayer ?? removeAndReturnPermissionType(this, "nonplayer"),
			player: channelTypeOptions.player ?? removeAndReturnPermissionType(this, "player"),
			search: channelTypeOptions.search ?? removeAndReturnBooleanFlag(this, "search"),
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

	public removeAndReturnCharacterOptions(names: TNames, userDid?: Snowflake): GameCharacterCore {
		const characterCore: GameCharacterCore = {
			alias: this.removeByKey("alias")!,
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

	public removeAndReturnDialogType(): Optional<DialogType> {
		return removeAndReturnDialogType(this);
	}

	public removeAndReturnSagePostType(): Optional<DialogType> {
		return removeAndReturnSagePostType(this);
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
			return Color.from(color)?.toDiscordColor() ?? null;
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
			charName: this.removeByKey("charName") ?? this.removeByKey("char"),
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

	public async removeAndReturnRoleDid(): Promise<Snowflake | null> {
		if (this.isEmpty) {
			return null;
		}

		const roleDid = await this.asyncFindArgAndRemoveAndMap<Snowflake | undefined>(async arg => {
			const did = isNonNilSnowflake(arg) ? arg : parseId(arg, "role");
			if (did) {
				const role = await this.sageMessage.discord.fetchGuildRole(did);
				return role?.id;
			}
			return undefined;
		});

		return roleDid ?? null;
	}

	public async removeAndReturnServer(): Promise<Optional<Server>> {
		if (this.isEmpty) {
			return null;
		}

		const servers = this.sageMessage.caches.servers;

		const server = await this.asyncFindArgAndRemoveAndMap<Optional<Server>>(async arg =>
			isNonNilUuid(arg) ? servers.getById(arg)
			: isNonNilSnowflake(arg) ? servers.getByDid(arg)
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
	// 	return userDids.filter(toUnique);
	// }
	public async removeAndReturnUserDid(argKey?: string, defaultIfNoArg = true): Promise<Snowflake | null> {
		if (this.isEmpty) {
			return null;
		}

		const discord = this.sageMessage.caches.discord;
		const userRepo = this.sageMessage.caches.users;

		let userDid: Optional<Snowflake>;
		if (argKey && this.findKeyValueArgIndex(argKey)) {
			userDid = await argToSnowflake(this.removeByKey(argKey)!);
		}
		if (!userDid && defaultIfNoArg) {
			userDid = await this.asyncFindArgAndRemoveAndMap<Snowflake | undefined>(async arg => argToSnowflake(arg));
		}
		return userDid ?? null;

		async function argToSnowflake(arg: string): Promise<Snowflake | undefined> {
			const userId = parseId(arg, "user");
			if (userId) return userId;

			if (isNonNilSnowflake(arg)) {
				const member = await discord.fetchGuildMember(arg);
				return member?.id;
			}

			if (isNonNilUuid(arg)) {
				const user = await userRepo.getById(arg);
				return user?.did;
			}

			return undefined;
		}
	}

	//#endregion

	//#region SageCommandArgs

	/** @todo determine if we really need this ... is this a leak we /actually/ have? */
	public clear(): void {
		(this as any).sageMessage = undefined!;
	}

	private getKeyValueArg(key: string) {
		const keyValueArg = this.findKeyValueArgIndex(key)?.ret;

		const hasKey = !!keyValueArg;
		if (!keyValueArg) {
			return { hasKey };
		}

		const hasValue = isDefined(keyValueArg.value);
		if (!hasValue) {
			return { hasKey, hasValue };
		}

		const value = keyValueArg.value;
		const hasUnset = /^\s*unset\s*$/i.test(value);

		return { hasKey, hasUnset, hasValue, value };
	}

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		return !!this.findKeyValueArgIndex(name);
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		return /^\s*unset\s*$/i.test(this.findKeyValueArgIndex(name)?.ret?.value ?? "");
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public getBoolean(name: string): Optional<boolean>;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string): Optional<boolean> {
		const string = this.getString(name);
		if (isDefined(string)) {
			if (/^(1|yes|y|true|t)$/i.test(string)) {
				return true;
			}else if (/^(0|no|n|false|f)$/i.test(string)) {
				return false;
			}
			return null;
		}
		return string;
	}

	/** Returns true if getBoolean(name) is not null and not undefined. */
	public hasBoolean(name: string): boolean {
		return isDefined(this.getBoolean(name));
	}

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getChannel<T extends GuildBasedChannel>(name: string): Optional<T>;
	/** Gets the named option as a GuildBasedChannel */
	public getChannel<T extends GuildBasedChannel>(name: string, required: true): T;
	public getChannel<T extends GuildBasedChannel>(name: string): Optional<T> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue) {
			const channelId = parseId(keyValueArg.value, "channel");
			if (channelId) {
				const channel = this.sageMessage.message.mentions.channels.get(channelId) ?? null;
				return channel as T;
			}
		}
		return null;
	}

	/** Returns true if getChannel(name) is not null and not undefined. */
	public hasChannel(name: string): boolean {
		return isDefined(this.getChannel(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getChannelId(name: string): Optional<Snowflake>;
	/** Gets the named option as a Snowflake */
	public getChannelId(name: string, required: true): Snowflake;
	public getChannelId(name: string): Optional<Snowflake> {
		const channel = this.getChannel(name);
		return channel ? channel.id : channel;
	}

	/** Returns true if getChannelId(name) is not null and not undefined. */
	public hasChannelId(name: string): boolean {
		return isDefined(this.getChannelId(name));
	}

	/** Returns an array of channelIds passed in for the given argument. */
	public getChannelIds(name: string): Snowflake[] {
		const stringValue = this.getString(name);
		if (stringValue) {
			return parseIds(stringValue, "channel");
		}
		return [];
	}

	public findEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>): Optional<V> {
		for (const arg of this) {
			const value = parseEnum(type, arg);
			if (value !== undefined) {
				return value as V;
			}
		}
		return undefined;
	}

	/**
	 * Gets the named option as a value from the given enum type.
	 * Returns undefined if not found.
	 * Returns null if not a valid enum value or "unset".
	 */
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): Optional<V>;
	/** Gets the named option as a value from the given enum type. */
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string, required: true): V;
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): Optional<V> {
		const string = this.getString(name);
		if (isDefined(string)) {
			return parseEnum(type, string) ?? null;
		}
		return string;
	}

	/** Returns true if getEnum(type, name) is not null and not undefined. */
	public hasEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): boolean {
		return isDefined(this.getEnum(type, name));
	}

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	public getNumber(name: string): Optional<number>;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string): Optional<number> {
		const string = this.getString(name);
		if (isDefined(string)) {
			const number = +string;
			return isNaN(number) ? null : number;
		}
		return string;
	}

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return isDefined(this.getNumber(name));
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getRole(name: string): Optional<Role>;
	/** Gets the named option as a GuildBasedChannel */
	public getRole(name: string, required: true): Role;
	public getRole(name: string): Optional<Role> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue) {
			const roleId = parseId(keyValueArg.value, "role");
			if (roleId) {
				return this.sageMessage.message.mentions.roles.get(roleId) ?? null;
			}
		}
		return null;
	}

	/** Returns true if getRole(name) is not null and not undefined. */
	public hasRole(name: string): boolean {
		return isDefined(this.getRole(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getRoleId(name: string): Optional<Snowflake>;
	/** Gets the named option as a Snowflake */
	public getRoleId(name: string, required: true): Snowflake;
	public getRoleId(name: string): Optional<Snowflake> {
		const role = this.getRole(name);
		return role ? role.id : role;
	}

	/** Returns true if getRoleId(name) is not null and not undefined. */
	public hasRoleId(name: string): boolean {
		return isDefined(this.getRoleId(name));
	}

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getString<U extends string = string>(name: string): Optional<U>;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string): Optional<string> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue && isNotBlank(keyValueArg.value)) {
			return keyValueArg.value;
		}
		return null;
	}

	/** Returns true if getString(name) is not null and not undefined. */
	public hasString(name: string): boolean;
	/** Returns true if the argument was given the value passed. */
	public hasString(name: string, value: string): boolean;
	/** Returns true if the argument matches the given regex. */
	public hasString(name: string, regex: RegExp): boolean;
	public hasString(name: string, value?: string | RegExp): boolean {
		const argValue = this.getString(name);
		if (!argValue) return false;
		if (value) {
			if (typeof(value) === "string") return argValue === value;
			return value.test(argValue);
		}
		return true;
	}

	/** Returns an array of user snowflakes passed in for the given argument. Optionally finds roles and gets all the users from the roles. */
	public async getUserIds(name: string, expandRoles?: boolean): Promise<Snowflake[]> {
		/** @todo investigate iterating over all the message.mentions and testing the stringValue for the \bSNOWFLAKE\b */
		const stringValue = this.getString(name);
		if (stringValue) {
			const userIds = parseIds(stringValue, "user");
			const userIdSet = new Set(userIds);
			if (expandRoles) {
				const roleIds = parseIds(stringValue, "role");
				for (const roleId of roleIds) {
					const guildRole = await this.sageMessage.discord.fetchGuildRole(roleId);
					if (guildRole) {
						guildRole.members.forEach(guildMember => userIdSet.add(guildMember.id));
					}
				}
			}
			return [...userIdSet];
		}
		return [];
	}

	/**
	 * Gets the named option as a VALID_UUID.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getUuid(name: string): Optional<UUID>;
	/** Gets the named option as a VALID_UUID. */
	public getUuid(name: string, required: true): UUID;
	public getUuid(name: string): Optional<UUID> {
		const value = this.getString(name);
		if (value) {
			return isUuid(value) ? value : null;
		}
		return value as null | undefined;
	}

	/** Returns true if getUuid(name) is not null and not undefined. */
	public hasUuid(name: string): boolean {
		return isDefined(this.getUuid(name));
	}

	//#endregion
}
