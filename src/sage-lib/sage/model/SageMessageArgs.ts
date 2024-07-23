import { type SageChannel } from "@rsc-sage/types";
import { isDefined, isNonNilSnowflake, isNonNilUuid, parseEnum, type EnumLike, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { parseId, type MessageChannel } from "@rsc-utils/discord-utils";
import { isUrl } from "@rsc-utils/io-utils";
import { isNotBlank, unwrap } from "@rsc-utils/string-utils";
import type { Attachment, Collection, Role, User } from "discord.js";
import type { ArgsManager } from "../../discord/ArgsManager.js";
import type { TColorAndType } from "./Colors.js";
import type { GameCharacterCore } from "./GameCharacter.js";
import { ColorType } from "./HasColorsCore.js";
import { SageCommandArgs, type Names } from "./SageCommandArgs.js";
import type { SageMessage } from "./SageMessage.js";
import type { Server } from "./Server.js";

export type TKeyValuePair = { key: string; value: string; };

type TArgIndexRet<T> = { arg: string; index: number; ret: T };

export class SageMessageArgs extends SageCommandArgs<SageMessage> {
	public constructor(sageMessage: SageMessage, private argsManager: ArgsManager) {
		super(sageMessage);
	}

	//#region deprecated passthroughs
	/** @deprecated */
	public join(joiner?: string) { return this.argsManager.join(joiner); }
	/** @deprecated */
	public shift() { return this.argsManager.shift(); }
	/** @deprecated */
	public keyValuePairs() { return this.argsManager.keyValuePairs(); }
	/** @deprecated */
	public filter(predicate: (value: string, index: number, array: string[]) => unknown, arg?: any) { return this.argsManager.filter(predicate, arg); }
	/** @deprecated */
	public nonKeyValuePairs() { return this.argsManager.findArgIndexNonArgs().map(non => non.arg).filter(s => s.trim()); }
	/** @deprecated */
	public toArray(): string[] { return this.argsManager; }
	//#endregion

	//#region Old

	/** @deprecated */
	private attachments?: Collection<string, Attachment>;

	/** @deprecated */
	public removeAndReturnAttachmentUrl(): string | undefined {
		const attachments = this.attachments ?? (this.attachments = this.sageCommand.message.attachments.clone());
		if (attachments.size) {
			const first = attachments.first();
			attachments.delete(<string>attachments.firstKey());
			return first!.url;
		}
		return this.argsManager.removeAndReturnUrl();
	}

	/** @deprecated */
	protected async findChannelIndexWithDid(): Promise<TArgIndexRet<Snowflake> | undefined> {
		if (this.argsManager.isEmpty) {
			return undefined;
		}

		return <Promise<TArgIndexRet<Snowflake> | undefined>>this.argsManager.asyncFindArgIndexRet(async arg => {
			const trimmed = arg?.trim();
			const did = isNonNilSnowflake(trimmed) ? trimmed : parseId(trimmed, "channel");
			if (did) {
				const channel = await this.sageCommand.discord.fetchChannel(did);
				return channel?.id;
			}
			return undefined;
		});
	}

	/** @deprecated */
	public async removeAndReturnChannelDid(): Promise<Snowflake | null>;
	/** @deprecated */
	public async removeAndReturnChannelDid(defaultThisChannel: false): Promise<Snowflake | null>;
	/** @deprecated */
	public async removeAndReturnChannelDid(defaultThisChannel: true): Promise<Snowflake>;
	/** @deprecated */
	public async removeAndReturnChannelDid(defaultThisChannel = false): Promise<Snowflake | null> {
		const withIndex = await this.findChannelIndexWithDid();
		if (withIndex) {
			this.argsManager.removeByArgAndIndex(withIndex);
			return withIndex.ret;
		}
		return defaultThisChannel ? this.sageCommand.threadOrChannelDid : null;
	}

	/** @deprecated */
	public getCharacterOptions(names: Names, userDid?: Snowflake): GameCharacterCore {
		// get the options directly
		const characterCore: GameCharacterCore = {
			alias: this.getString("alias")!,
			autoChannels: undefined,
			avatarUrl: this.getUrl("avatar")!,
			companions: undefined,
			embedColor: this.getHexColorString("color")!,
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

	/** @deprecated */
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

	/** @deprecated */
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

	/** @deprecated */
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

	/** @deprecated */
	public removeAndReturnNames(defaultJoinRemaining = false, defaultJoinSeparator = " "): Names {
		const names = {
			charName: this.argsManager.removeByKey("charName") ?? this.argsManager.removeByKey("char"),
			oldName: this.argsManager.removeByKey("oldName"),
			name: this.argsManager.removeByKey("name"),
			newName: this.argsManager.removeByKey("newName"),
			count: 0
		} as Names;
		names.count = (names.charName ? 1 : 0) + (names.oldName ? 1 : 0) + (names.name ? 1 : 0) + (names.newName ? 1 : 0);
		if (!names.count) {
			names.name = this.removeAndReturnName(defaultJoinRemaining, defaultJoinSeparator);
		}
		return names;
	}

	/** @deprecated */
	public async removeAndReturnRoleDid(): Promise<Snowflake | null> {
		if (this.argsManager.isEmpty) {
			return null;
		}

		const roleDid = await this.argsManager.asyncFindArgAndRemoveAndMap<Snowflake | undefined>(async arg => {
			const trimmed = arg?.trim();
			const did = isNonNilSnowflake(trimmed) ? trimmed : parseId(trimmed, "role");
			if (did) {
				const role = await this.sageCommand.discord.fetchGuildRole(did);
				return role?.id as Snowflake;
			}
			return undefined;
		});

		return roleDid ?? null;
	}

	/** @deprecated */
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

	/** @deprecated */
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
			const trimmed = arg?.trim();
			const userId = isNonNilSnowflake(trimmed) ? trimmed : parseId(trimmed, "user");
			if (userId) return userId;

			if (isNonNilSnowflake(arg)) {
				const member = await discord.fetchGuildMember(arg);
				return member?.id as Snowflake;
			}

			if (isNonNilUuid(arg)) {
				const user = await userRepo.getById(arg);
				return user?.did;
			}

			return undefined;
		}
	}

	//#endregion

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

	/** Returns a list of all argument keys passed to the command. */
	public keys(): string[] {
		return this.argsManager.keyValuePairs().map(kvp => kvp.key);
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
	public getChannel<T extends MessageChannel>(name: string): Optional<T> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue) {
			const channelId = parseId(keyValueArg.value.trim(), "channel");
			if (channelId) {
				const channel = this.sageCommand.message.mentions.channels.get(channelId) ?? null;
				return channel as unknown as T;
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
	public getRole(name: string): Optional<Role> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue) {
			const roleId = parseId(keyValueArg.value.trim(), "role");
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
	public getString<U extends string = string>(name: string): Optional<U> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue && isNotBlank(keyValueArg.value)) {
			return keyValueArg.value as U;
		}
		return null;
	}

	/**
	 * Gets the named option as a User.
	 * Returns undefined if not found.
	 * Returns null if not a valid User or "unset".
	 */
	public getUser(name: string): Optional<User> {
		const keyValueArg = this.getKeyValueArg(name);
		if (!keyValueArg.hasKey) return undefined;
		if (keyValueArg.hasUnset) return null;
		if (keyValueArg.hasValue) {
			const userId = parseId(keyValueArg.value.trim(), "user");
			if (userId) {
				return this.sageCommand.message.mentions.users.get(userId) ?? null;
			}
		}
		return null;
	}

	//#endregion
}
