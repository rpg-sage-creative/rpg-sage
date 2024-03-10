import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { UUID } from "@rsc-utils/uuid-utils";
import type { GuildBasedChannel, Role } from "discord.js";

export type EnumLike<K extends string = string, V extends number = number> = Record<K, V>;

export interface SageCommandArgs {
	/** do any internal cleanup to avoid memory leaks */
	clear(): void;

	/** Returns true if an argument matches the given key, regardless of value. */
	hasKey(key: string): boolean;

	/** Returns true if the argument matching the given key has the value "unset". */
	hasUnset(key: string): boolean;

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	getBoolean(name: string): Optional<boolean>;
	/** Gets the named option as a boolean */
	getBoolean(name: string, required: true): boolean;
	/** Returns true if getBoolean(name) is not null and not undefined. */
	hasBoolean(name: string): boolean;

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	getChannel(name: string): Optional<GuildBasedChannel>;
	/** Gets the named option as a GuildBasedChannel */
	getChannel(name: string, required: true): GuildBasedChannel;
	/** Returns true if getChannel(name) is not null and not undefined. */
	hasChannel(name: string): boolean;

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	getChannelId(name: string): Optional<Snowflake>;
	/** Gets the named option as a Snowflake */
	getChannelId(name: string, required: true): Snowflake;
	/** Returns true if getChannelId(name) is not null and not undefined. */
	hasChannelId(name: string): boolean;

	/** Returns an array of channelIds passed in for the given argument. */
	getChannelIds(name: string): Snowflake[];

	findEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>): Optional<V>;

	/**
	 * Gets the named option as a value from the given enum type.
	 * Returns undefined if not found.
	 * Returns null if not a valid enum value or "unset".
	 */
	getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): Optional<V>;
	/** Gets the named option as a value from the given enum type. */
	getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string, required: true): V;
	/** Returns true if getEnum(type, name) is not null and not undefined. */
	hasEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): boolean;
	/** Returns true if getEnum(type, name) matches {value} passed value. */
	// hasEnum<U>(type: any, name: string, value: U): boolean;

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	getNumber(name: string): Optional<number>;
	/** Gets the named option as a number */
	getNumber(name: string, required: true): number;
	/** Returns true if getNumber(name) is not null and not undefined. */
	hasNumber(name: string): boolean;

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid Role or "unset".
	 */
	getRole(name: string): Optional<Role>;
	/** Gets the named option as a Role */
	getRole(name: string, required: true): Role;
	/** Returns true if getRole(name) is not null and not undefined. */
	hasRole(name: string): boolean;

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	getRoleId(name: string): Optional<Snowflake>;
	/** Gets the named option as a Snowflake */
	getRoleId(name: string, required: true): Snowflake;
	/** Returns true if getRoleId(name) is not null and not undefined. */
	hasRoleId(name: string): boolean;

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	getString<U extends string = string>(name: string): Optional<U>;
	/** Gets the named option as a string */
	getString<U extends string = string>(name: string, required: true): U;
	/** Returns true if getString(name) is not null and not undefined. */
	hasString(name: string): boolean;
	/** Returns true if the argument was given the value passed. */
	hasString(name: string, value: string): boolean;
	/** Returns true if the argument matches the given regex. */
	hasString(name: string, regex: RegExp): boolean;

	/** Returns an array of user snowflakes passed in for the given argument. Optionally finds roles and gets all the users from the roles. */
	getUserIds(name: string, expandRole?: boolean): Promise<Snowflake[]>;

	/**
	 * Gets the named option as a VALID_UUID.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	getUuid(name: string): Optional<UUID>;
	/** Gets the named option as a VALID_UUID. */
	getUuid(name: string, required: true): UUID;
	/** Returns true if getUuid(name) is not null and not undefined. */
	hasUuid(name: string): boolean;

}

// export function getEnum<K extends string = string, V extends number = number>(args: SageCommandArgs, enumLike: EnumLike<K, V>, ...keys: string[]): Optional<V> {
// 	for (const key of keys) {
// 		const value = args.getEnum(enumLike, key);
// 		if (value !== undefined) {
// 			return value;
// 		}
// 	}
// 	return undefined;
// }

// export function cleanEnumArgValues<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value: string): string;
// export function cleanEnumArgValues(enumLike: EnumLike<any, any>, value: string): string {
// 	if (enumLike === GameChannelType) {
// 		return GameChannelType[parseGameChannelType(value)!];
// 	}
// 	if (enumLike === DiceCritMethodType) {
// 		return value.match(/x2/i) ? "TimesTwo" : value;
// 	}
// 	// DialogType = fine
// 	// DiceOutputType = fine
// 	if (enumLike === DicePostType) {
// 		return value.match(/post/i) ? "SinglePost" : value.match(/embed/i) ? "SingleEmbed" : value;
// 	}
// 	if (enumLike === DiceSecretMethodType) {
// 		return value.match(/gm/i) ? "GameMasterChannel" : value.match(/dm/i) ? "GameMasterDirect" : value;
// 	}
// 	if (enumLike === GameType) {
// 		return GameType[parseGameType(value)!];
// 	}
// 	return value;
// }