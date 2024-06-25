import type { Optional, OrUndefined, Snowflake } from "@rsc-utils/core-utils";
import type { Channel, Message } from "discord.js";
import type { DiscordKey } from "../DiscordKey.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable, type SnowflakeResolvable } from "./resolveSnowflake.js";

export type ChannelIdResolvable = SnowflakeResolvable | Channel | Message;

export type CanBeChannelIdResolvable = ChannelIdResolvable | CanBeSnowflakeResolvable | DiscordKey; //NOSONAR

/** Resolves to Snowflake. */
export function resolveChannelId(resolvable: ChannelIdResolvable): Snowflake;

/** Resolves to Snowflake or undefined. */
export function resolveChannelId(resolvable: Optional<CanBeChannelIdResolvable>): OrUndefined<Snowflake>;

export function resolveChannelId(resolvable: Optional<CanBeChannelIdResolvable>): OrUndefined<Snowflake> {
	if (resolvable) {
		if (typeof(resolvable) !== "string" && "channelId" in resolvable) {
			return resolveSnowflake(resolvable.channelId);
		}
		return resolveSnowflake(resolvable);
	}
	return undefined;
}