import { DiceCritMethodType, DiceOutputType, DiceSecretMethodType, GameSystemType, PostType, SageChannelType, type DialogOptions, type DiceOptions, type SageChannel, type SageChannelOptions, type SystemOptions } from "@rsc-sage/types";
import { Color } from "@rsc-utils/color-utils";
import { parseId } from "@rsc-utils/discord-utils";
import { parseEnum } from "@rsc-utils/enum-utils";
import { isUrl } from "@rsc-utils/https-utils";
import { isEmpty } from "@rsc-utils/json-utils";
import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/snowflake-utils";
import { isNotBlank, unwrap } from "@rsc-utils/string-utils";
import { isDefined, type Args, type EnumLike, type Optional } from "@rsc-utils/type-utils";
import { isNonNilUuid } from "@rsc-utils/uuid-utils";
import type { Collection, GuildBasedChannel, MessageAttachment, Role } from "discord.js";
import { ArgsManager } from "../../discord/ArgsManager.js";
import type { TColorAndType } from "./Colors.js";
import type { GameOptions } from "./Game.js";
import type { GameCharacterCore } from "./GameCharacter.js";
import { ColorType } from "./HasColorsCore.js";
import { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageMessage } from "./SageMessage.js";
import type { Server, ServerOptions } from "./Server.js";

export type TKeyValuePair = { key: string; value: string; };

type TArgIndexRet<T> = { arg: string; index: number; ret: T };

export type TNames = {
	charName?: string;
	oldName?: string;
	name?: string;
	newName?: string;
	count?: number;
};

export class SageMessageArgs extends SageCommandArgs<SageMessage> {
	public constructor(sageMessage: SageMessage, private argsManager: ArgsManager) {
		super(sageMessage);
	}

	//#region deprecated passthroughs
	/** @deprecated */
	public shift() { return this.argsManager.shift(); }
	/** @deprecated */
	public keyValuePairs() { return this.argsManager.keyValuePairs(); }
	/** @deprecated */
	public filter(predicate: (value: string, index: number, array: string[]) => unknown, arg?: any) { return this.argsManager.filter(predicate, arg); }
	//#endregion

	//#region Old

	private attachments?: Collection<Snowflake, MessageAttachment>;
	public removeAndReturnAttachmentUrl(): string | undefined {
		const attachments = this.attachments ?? (this.attachments = this.sageCommand.message.attachments.clone());
		if (attachments.size) {
			const first = attachments.first();
			attachments.delete(<string>attachments.firstKey());
			return first!.url;
		}
		return this.argsManager.removeAndReturnUrl();
	}

	protected async findChannelIndexWithDid(): Promise<TArgIndexRet<Snowflake> | undefined> {
		if (this.argsManager.isEmpty) {
			return undefined;
		}

		return <Promise<TArgIndexRet<Snowflake> | undefined>>this.argsManager.asyncFindArgIndexRet(async arg => {
			const did = isNonNilSnowflake(arg) ? arg : parseId(arg, "channel");
			if (did) {
				const channel = await this.sageCommand.discord.fetchChannel(did);
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
			this.argsManager.removeByArgAndIndex(withIndex);
			return withIndex.ret;
		}
		return defaultThisChannel ? this.sageCommand.threadOrChannelDid : null;
	}

	public getChannelOptions(): Args<SageChannelOptions> | undefined {
		const channelOptions = {
			...this.getDialogOptions(),
			...this.getDiceOptions(),
			...this.getSystemOptions(),
			type: this.getEnum(SageChannelType, "type"),
		};
		if (isEmpty(channelOptions)) {
			return undefined;
		}
		return channelOptions;
	}
	public getDialogOptions(): Args<DialogOptions> | undefined {
		const dialogOptions = {
			dialogPostType: this.getEnum(PostType, "dialogPost"),
			gmCharacterName: this.getString("gmCharName"),
			sendDialogTo: this.getChannelId("dialogTo"),
		};
		if (isEmpty(dialogOptions)) {
			return undefined;
		}
		return dialogOptions;
	}
	public getDiceOptions(): Args<DiceOptions> | undefined {
		const diceOptions = {
			diceCritMethodType: this.getEnum(DiceCritMethodType, "diceCrit"),
			diceOutputType: this.getEnum(DiceOutputType, "diceOutput"),
			dicePostType: this.getEnum(PostType, "dicePost"),
			diceSecretMethodType: this.getEnum(DiceSecretMethodType, "diceSecret"),
			sendDiceTo: this.getChannelId("diceTo"),
		};
		if (isEmpty(diceOptions)) {
			return undefined;
		}
		return diceOptions;
	}
	public getGameOptions(): Args<GameOptions> | undefined {
		const gameOptions = {
			...this.getDialogOptions(),
			...this.getDiceOptions(),
			...this.getSystemOptions(),
			name: this.getString("name"),
		};
		if (isEmpty(gameOptions)) {
			return undefined;
		}
		return gameOptions;
	}
	public getServerOptions(): Args<ServerOptions> | undefined {
		const serverOptions = {
			...this.getDialogOptions(),
			...this.getDiceOptions(),
			...this.getSystemOptions(),
		};
		if (isEmpty(serverOptions)) {
			return undefined;
		}
		return serverOptions;
	}
	public getSystemOptions(): Args<SystemOptions> | undefined {
		const serverOptions = {
			gameSystemType: this.getEnum(GameSystemType, "gameSystem"),
		};
		if (isEmpty(serverOptions)) {
			return undefined;
		}
		return serverOptions;
	}

	public getCharacterOptions(names: TNames, userDid?: Snowflake): GameCharacterCore {
		// get the options directly
		const characterCore: GameCharacterCore = {
			alias: this.getString("alias")!,
			autoChannels: undefined,
			avatarUrl: this.getUrl("avatar")!,
			companions: undefined,
			embedColor: this.getDiscordColor("color")!,
			id: undefined!,
			tokenUrl: this.getUrl("token")!,
			name: names.newName ?? names.name!,
			userDid: userDid ?? undefined
		};

		// see if they simply attached an image
		const needsToken = characterCore.tokenUrl === undefined;
		const needsAvatar = characterCore.avatarUrl === undefined;
		if (needsToken || needsAvatar) {
			const { attachments } = this.sageCommand.message;
			if (attachments.size) {
				const first = attachments.first()?.url;
				if (needsToken && needsAvatar) {
					characterCore.tokenUrl = first;
					characterCore.avatarUrl = attachments.at(1)?.url;
				}else if (needsToken) {
					characterCore.tokenUrl = first;
				}else if (needsAvatar) {
					characterCore.avatarUrl = first;
				}
			}
		}
		return characterCore;
	}

	public removeAndReturnColorAndType(): TColorAndType | null {
		if (this.argsManager.isEmpty) {
			return null;
		}
		//TODO: find them separately before removing them
		const color = this.argsManager.removeAndReturnColor(),
			type = this.argsManager.removeAndReturnEnum<ColorType>(ColorType);
		if (color && type) {
			return { color: color, type: type };
		}
		return null;
	}

	// public removeAndReturnDiscordColor(argKey?: string): Optional<string> {
	// 	if (argKey) {
	// 		const color = this.removeByKey(argKey);
	// 		// return appropriate null or undefined
	// 		if (typeof(color) !== "string") {
	// 			return color;
	// 		}
	// 		// return valid color or null
	// 		return Color.from(color)?.toDiscordColor() ?? null;
	// 	}
	// 	return this.removeAndReturnColor()?.toDiscordColor();
	// }

	public async removeAndReturnGameChannel(): Promise<SageChannel | null> {
		const game = this.sageCommand.game;
		if (!game) {
			return null;
		}

		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			const channel = game.getChannel(withIndex.ret);
			if (channel) {
				this.argsManager.removeByArgAndIndex(withIndex);
				return channel;
			}
		}

		return game.getChannel(this.sageCommand.channelDid) ?? null;
	}

	public removeAndReturnName(defaultJoinRemaining = false, defaultJoinSeparator = " "): string | undefined {
		const keyValue = this.argsManager.removeKeyValuePair("name");
		if (keyValue) {
			return keyValue.value ?? undefined;
		}

		const notKeyValue = this.argsManager.findArgIndexNonArgs().shift();
		if (notKeyValue) {
			this.argsManager.removeAt(notKeyValue.index);
			return notKeyValue.arg;
		}

		if (defaultJoinRemaining) {
			const name = this.argsManager.removeAndReturnNonArgs()
				.map(withIndex => withIndex.arg)
				.join(defaultJoinSeparator)
				.trim();
			return name === "" ? undefined : name;
		}

		return undefined;
	}

	public removeAndReturnNames(defaultJoinRemaining = false, defaultJoinSeparator = " "): TNames {
		const names = <TNames>{
			charName: this.argsManager.removeByKey("charName") ?? this.argsManager.removeByKey("char"),
			oldName: this.argsManager.removeByKey("oldName"),
			name: this.argsManager.removeByKey("name"),
			newName: this.argsManager.removeByKey("newName"),
			count: 0
		};
		names.count = (names.charName ? 1 : 0) + (names.oldName ? 1 : 0) + (names.name ? 1 : 0) + (names.newName ? 1 : 0);
		if (!names.count) {
			names.name = this.removeAndReturnName(defaultJoinRemaining, defaultJoinSeparator);
		}
		return names;
	}

	public async removeAndReturnRoleDid(): Promise<Snowflake | null> {
		if (this.argsManager.isEmpty) {
			return null;
		}

		const roleDid = await this.argsManager.asyncFindArgAndRemoveAndMap<Snowflake | undefined>(async arg => {
			const did = isNonNilSnowflake(arg) ? arg : parseId(arg, "role");
			if (did) {
				const role = await this.sageCommand.discord.fetchGuildRole(did);
				return role?.id;
			}
			return undefined;
		});

		return roleDid ?? null;
	}

	public async removeAndReturnServer(): Promise<Optional<Server>> {
		if (this.argsManager.isEmpty) {
			return null;
		}

		const servers = this.sageCommand.sageCache.servers;

		const server = await this.argsManager.asyncFindArgAndRemoveAndMap<Optional<Server>>(async arg =>
			isNonNilUuid(arg) ? servers.getById(arg)
			: isNonNilSnowflake(arg) ? servers.getByDid(arg)
			: undefined
		);

		return server ?? null;
	}

	public async removeAndReturnServerChannel(): Promise<SageChannel | null> {
		const server = this.sageCommand.server;
		if (!server) {
			return null;
		}

		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			const channel = server.getChannel(withIndex.ret);
			if (channel) {
				this.argsManager.removeAt(withIndex.index);
				return channel;
			}
		}

		return server.getChannel(this.sageCommand.discordKey) ?? null;
	}

	// public async removeAndReturnUserDids(): Promise<Discord.Snowflake[]> {
	// 	const users = this.sageCommand.message.mentions.users.array();
	// 	const userDids = users.map(user => <Discord.Snowflake>user.id);
	// 	let userDid: Discord.Snowflake;
	// 	while (userDid = await this.removeAndReturnUserDid()) {
	// 		userDids.push(userDid);
	// 	}
	// 	return userDids.filter(toUnique);
	// }
	public async removeAndReturnUserDid(argKey?: string, defaultIfNoArg = true): Promise<Snowflake | null> {
		if (this.argsManager.isEmpty) {
			return null;
		}

		const discord = this.sageCommand.sageCache.discord;
		const userRepo = this.sageCommand.sageCache.users;

		let userDid: Optional<Snowflake>;
		if (argKey && this.argsManager.findKeyValueArgIndex(argKey)) {
			userDid = await argToSnowflake(this.argsManager.removeByKey(argKey)!);
		}
		if (!userDid && defaultIfNoArg) {
			userDid = await this.argsManager.asyncFindArgAndRemoveAndMap<Snowflake | undefined>(async arg => argToSnowflake(arg));
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

	public getDiscordColor(key: string): string | null | undefined {
		const color = this.getString(key);
		if (color) {
			return Color.from(color)?.toDiscordColor() ?? null;
		}
		return color;
	}

	public getUrl(key: string): string | null | undefined {
		const url = this.getString(key);
		if (url) {
			return isUrl(url) ? unwrap(url, "<>") : null;
		}
		return url;
	}

	//#region SageCommandArgs

	private getKeyValueArg(key: string) {
		const keyValueArg = this.argsManager.findKeyValueArgIndex(key)?.ret;

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
		return !!this.argsManager.findKeyValueArgIndex(name);
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		return /^\s*unset\s*$/i.test(this.argsManager.findKeyValueArgIndex(name)?.ret?.value ?? "");
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
				const channel = this.sageCommand.message.mentions.channels.get(channelId) ?? null;
				return channel as T;
			}
		}
		return null;
	}

	public findEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>): Optional<V> {
		for (const arg of this.argsManager) {
			const value = parseEnum(type, arg);
			if (value !== undefined) {
				return value as V;
			}
		}
		return undefined;
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
				return this.sageCommand.message.mentions.roles.get(roleId) ?? null;
			}
		}
		return null;
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

	//#endregion
}
