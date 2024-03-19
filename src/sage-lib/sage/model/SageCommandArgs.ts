import { DiceCritMethodType, DicePostType, DiceSecretMethodType, PostType, SageChannelType, parseSageChannelType } from "@rsc-sage/types";
import type { Snowflake } from "@rsc-utils/snowflake-utils";
import { isDefined, type Optional } from "@rsc-utils/type-utils";
import { isUuid, type UUID } from "@rsc-utils/uuid-utils";
import type { GuildBasedChannel, Role } from "discord.js";
import type { SageCommand } from "./SageCommand";
import { parseIds } from "@rsc-utils/discord-utils";
import { parseEnum } from "@rsc-utils/enum-utils";

export abstract class SageCommandArgs<T extends SageCommand> {
	public constructor(public sageCommand: T) { }

	/** @todo determine if we really need this ... is this a memory leak we /actually/ have? */
	public clear(): void { this.sageCommand = undefined!; }

	/** Returns true if an argument matches the given key, regardless of value. */
	public abstract hasKey(key: string): boolean;

	/** Returns true if the argument matching the given key has the value "unset". */
	public abstract hasUnset(key: string): boolean;

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public abstract getBoolean(key: string): Optional<boolean>;
	/** Gets the named option as a boolean */
	public abstract getBoolean(key: string, required: true): boolean;

	/** Returns true if getBoolean(name) is not null and not undefined. */
	public hasBoolean(key: string): boolean {
		return isDefined(this.getBoolean(key));
	}

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public abstract getChannel(name: string): Optional<GuildBasedChannel>;
	/** Gets the named option as a GuildBasedChannel */
	public abstract getChannel(name: string, required: true): GuildBasedChannel;

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

	/** @deprecated */
	public abstract findEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>): Optional<V>;

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
			return parseEnum(type, cleanEnumArgValues(type, string)) ?? null;
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
	public abstract getNumber(name: string): Optional<number>;
	/** Gets the named option as a number */
	public abstract getNumber(name: string, required: true): number;

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return isDefined(this.getNumber(name));
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid Role or "unset".
	 */
	public abstract getRole(name: string): Optional<Role>;
	/** Gets the named option as a Role */
	public abstract getRole(name: string, required: true): Role;

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
	public abstract getString<U extends string = string>(name: string): Optional<U>;
	/** Gets the named option as a string */
	public abstract getString<U extends string = string>(name: string, required: true): U;

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
					const guildRole = await this.sageCommand.discord.fetchGuildRole(roleId);
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

export function cleanEnumArgValues<K extends string = string, V extends number = number>(enumLike: EnumLike<K, V>, value: string): string;
export function cleanEnumArgValues(enumLike: EnumLike<any, any>, value: string): string {
	if (enumLike === PostType) {
		return /post/i.test(value) ? "content" : value;
	}
	if (enumLike === SageChannelType) {
		return SageChannelType[parseSageChannelType(value)!];
	}
	if (enumLike === DiceCritMethodType) {
		return /x2/i.test(value) ? "TimesTwo" : value;
	}
	// DiceOutputType = fine
	if (enumLike === PostType) {
		return value.replace(/post/i, "content");
	}
	if (enumLike === DiceSecretMethodType) {
		if (/gm/i.test(value)) {
			return "GameMasterChannel";
		}else if (/dm/i.test(value)) {
			return "GameMasterDirect";
		}
		return value;
	}
	// GameType = fine
	return value;
}