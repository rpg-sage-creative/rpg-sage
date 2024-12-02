import { isDefined, parseEnum, type EnumLike, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { parseId, type MessageChannel } from "@rsc-utils/discord-utils";
import { isNotBlank } from "@rsc-utils/string-utils";
import type { Attachment, Role, User } from "discord.js";
import type { ArgsManager } from "../../discord/ArgsManager.js";
import type { GameCharacterCore } from "./GameCharacter.js";
import { SageCommandArgs, type Names } from "./SageCommandArgs.js";
import type { SageMessage } from "./SageMessage.js";

/** Represents an argument that was 'key=value'. If value is an empty string, it will be set as NULL. */
export type TKeyValuePair<T extends string = string> = {
	/** The value on the left of the first equals sign. */
	key: string;
	/** This value is null if they value was an empty string. */
	value: T | null;
};

export class SageMessageArgs extends SageCommandArgs<SageMessage> {
	public constructor(sageMessage: SageMessage, private argsManager: ArgsManager) {
		super(sageMessage);
	}

	//#region deprecated passthroughs
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
	public removeAndReturnName(defaultJoinRemaining = false, defaultJoinSeparator = " "): string | undefined {
		const keyValue = this.argsManager.findKeyValueArgIndex("name")?.ret;
		if (keyValue) {
			return keyValue.value ?? undefined;
		}

		const notKeyValue = this.argsManager.findArgIndexNonArgs().shift();
		if (notKeyValue) {
			this.argsManager.removeAt(notKeyValue.index);
			return notKeyValue.arg;
		}

		if (defaultJoinRemaining) {
			const name = this.argsManager.findArgIndexNonArgs()
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
			charName: this.argsManager.findKeyValueArgIndex("charName")?.ret?.value,
			oldName: this.argsManager.findKeyValueArgIndex("oldName")?.ret?.value,
			name: this.argsManager.findKeyValueArgIndex("name")?.ret?.value,
			newName: this.argsManager.findKeyValueArgIndex("newName")?.ret?.value,
			count: 0
		} as Names;
		names.count = (names.charName ? 1 : 0) + (names.oldName ? 1 : 0) + (names.name ? 1 : 0) + (names.newName ? 1 : 0);
		if (!names.count) {
			names.name = this.removeAndReturnName(defaultJoinRemaining, defaultJoinSeparator);
		}
		return names;
	}

	//#endregion

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
	 * Gets the named option as an attachment.
	 * Returns undefined if not found.
	 * Returns null if not a valid attachment or "unset".
	 */
	public getAttachment(): Optional<Attachment> {
		return undefined;
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
