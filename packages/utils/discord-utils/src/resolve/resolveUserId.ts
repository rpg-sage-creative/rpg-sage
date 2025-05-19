import type { Optional, OrUndefined, Snowflake } from "@rsc-utils/core-utils";
import type { GuildMember, PartialUser, User } from "discord.js";
import type { DiscordKey } from "../DiscordKey.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable, type SnowflakeResolvable } from "./resolveSnowflake.js";

export type UserIdResolvable = SnowflakeResolvable | User | PartialUser | GuildMember;

export type CanBeUserIdResolvable = UserIdResolvable | CanBeSnowflakeResolvable | DiscordKey; //NOSONAR

/** Resolves to Snowflake. */
export function resolveUserId(resolvable: UserIdResolvable): Snowflake;

/** Resolves to Snowflake or undefined. */
export function resolveUserId(resolvable: Optional<CanBeUserIdResolvable>): OrUndefined<Snowflake>;

export function resolveUserId(resolvable: Optional<CanBeUserIdResolvable>): OrUndefined<Snowflake> {
	if (resolvable) {
		if (typeof(resolvable) !== "string") {
			if ("userId" in resolvable) {
				return resolveSnowflake(resolvable.userId);
			}
			if ("user" in resolvable) {
				return resolveSnowflake(resolvable.user.id);
			}
		}
		return resolveSnowflake(resolvable);
	}
	return undefined;
}