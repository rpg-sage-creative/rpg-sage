import { isDefined, isNonNilSnowflake, isNotBlank, type ArgsManager, type Optional } from "@rsc-utils/core-utils";
import { parseId, type SupportedChannel } from "@rsc-utils/discord-utils";
import type { Attachment, Role, User } from "discord.js";
import { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageMessage } from "./SageMessage.js";

const UnsetRegExp = /^\s*unset\s*$/i;

export class SageMessageArgs extends SageCommandArgs<SageMessage> {
	public constructor(sageMessage: SageMessage, private argsManager: ArgsManager) {
		super(sageMessage);
	}

	/** Returns the underlying ArgsManager. */
	public get manager(): ArgsManager { return this.argsManager; }

	//#region SageCommandArgs

	private getKeyValueArg(key: string) {
		const keyValueArg = this.argsManager.findKeyValueArg(key.toLowerCase());

		const hasKey = !!keyValueArg;
		if (!hasKey) {
			return { hasKey };
		}

		const hasValue = isDefined(keyValueArg.value);
		if (!hasValue) {
			return { hasKey, hasValue };
		}

		const value = keyValueArg.value!;
		const hasUnset = UnsetRegExp.test(value);

		return { hasKey, hasUnset, hasValue, value };
	}

	/** Returns a list of all argument keys passed to the command. */
	public keys(): string[] {
		return this.argsManager.keyValueArgs().map(kvp => kvp.key);
	}

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		return !!this.argsManager.findKeyValueArg(name.toLowerCase());
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		return this.getKeyValueArg(name).hasUnset === true;
	}

	/** Returns true if the underlying args contains the given flag. */
	public hasFlag(flag: string): boolean {
		return this.argsManager.hasFlag(flag.toLowerCase());
	}

	/** Returns true if the conmmand includes the force confirmation flag. */
	public get hasForceConfirmationFlag(): boolean {
		return this.hasFlag(this.sageCommand.sageUser.forceConfirmationFlag ?? "-p");
	}

	/** Returns true if the conmmand includes the skip confirmation flag. */
	public get hasSkipConfirmationFlag(): boolean {
		return this.hasFlag(this.sageCommand.sageUser.skipConfirmationFlag ?? "-y");
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
			if (/^(1|yes|y|true|t|on)$/i.test(string)) {
				return true;
			}else if (/^(0|no|n|false|f|off)$/i.test(string)) {
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
	public getChannel<T extends SupportedChannel>(name: string): Optional<T> {
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

	/**
	 * Gets the named option as a flag that starts with a "-".
	 * Returns undefined if not found.
	 * Returns null if not a valid flag,; valid example: -y
	 */
	public getFlag<U extends string = string>(name: string): Optional<U> {
		const value = this.getString<U>(name);
		if (value && !value.startsWith("-")) {
			return null;
		}
		return value;
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
			const trimmed = keyValueArg.value.trim();
			// check for mention
			const userId = parseId(trimmed, "user");
			if (userId) {
				return this.sageCommand.message.mentions.users.get(userId) ?? null;
			}
			// check for raw snowflake
			if (isNonNilSnowflake(trimmed)) {
				return this.sageCommand.discord.client.users.cache.get(trimmed) ?? null;
			}
		}
		return null;
	}

	//#endregion
}
