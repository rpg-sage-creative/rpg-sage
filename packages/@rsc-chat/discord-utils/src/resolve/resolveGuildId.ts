import type { Optional, OrUndefined, Snowflake } from "@rsc-utils/core-utils";
import type { GuildPreview, GuildResolvable } from "discord.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable, type SnowflakeResolvable } from "./resolveSnowflake.js";

export type GuildIdResolvable = GuildResolvable | GuildPreview | SnowflakeResolvable; //NOSONAR

export type CanBeGuildIdResolvable = GuildIdResolvable | CanBeSnowflakeResolvable;

/** Resolves to Snowflake. */
export function resolveGuildId(resolvable: GuildIdResolvable): Snowflake;

/** Resolves to Snowflake or undefined. */
export function resolveGuildId(resolvable: Optional<CanBeGuildIdResolvable>): OrUndefined<Snowflake>;

export function resolveGuildId(resolvable: Optional<CanBeGuildIdResolvable>): OrUndefined<Snowflake> {
	if (resolvable) {
		if (typeof(resolvable) !== "string" && "guild" in resolvable) {
			return resolveSnowflake(resolvable.guild?.id);
		}
		return resolveSnowflake(resolvable);
	}
	return undefined;
}