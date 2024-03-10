import { isDefined, type Optional } from "@rsc-utils/type-utils";
import type { UUID } from "@rsc-utils/uuid-utils";
import type { GuildBasedChannel, Role, Snowflake } from "discord.js";
import type { EnumLike, SageCommandArgs } from "./SageCommandArgs.js";

export class SageReactionArgs implements SageCommandArgs {

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean;
	public hasKey(): boolean {
		return false;
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean;
	public hasUnset(): boolean {
		return false;
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public getBoolean(name: string): Optional<boolean>;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(): Optional<boolean> {
		return false;
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
	public getChannel(name: string): Optional<GuildBasedChannel>;
	/** Gets the named option as a GuildBasedChannel */
	public getChannel(name: string, required: true): GuildBasedChannel;
	public getChannel(): Optional<GuildBasedChannel> {
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
	public getChannelId(): Optional<Snowflake> {
		return null;
	}

	/** Returns true if getChannelId(name) is not null and not undefined. */
	public hasChannelId(name: string): boolean {
		return isDefined(this.getChannelId(name));
	}

	public getChannelIds(_name: string, _expandRole?: boolean): Snowflake[] { return []; }


	public findEnum<K extends string = string, V extends number = number>(_type: EnumLike<K, V>): Optional<V> {
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
	public getEnum(): null {
		return null;
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
	public getNumber(): Optional<number> {
		return null;
	}

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return isDefined(this.getNumber(name));
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid Role or "unset".
	 */
	public getRole(name: string): Optional<Role>;
	/** Gets the named option as a GuildBasedChannel */
	public getRole(name: string, required: true): Role;
	public getRole(): Optional<Role> {
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
	public getRoleId(): Optional<Snowflake> {
		return null;
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
	public getString(): Optional<string> {
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

	public async getUserIds(_name: string, _expandRole?: boolean): Promise<Snowflake[]> { return []; }

	/**
	 * Gets the named option as a VALID_UUID.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getUuid(name: string): Optional<UUID>;
	/** Gets the named option as a VALID_UUID. */
	public getUuid(name: string, required: true): UUID;
	public getUuid(): Optional<UUID> {
		return null;
	}

	/** Returns true if getUuid(name) is not null and not undefined. */
	public hasUuid(name: string): boolean {
		return isDefined(this.getUuid(name));
	}

	public clear(): void { }
}