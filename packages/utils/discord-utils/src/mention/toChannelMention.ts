import { type Optional } from "@rsc-utils/core-utils";
import { channelMention } from "discord.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable } from "../resolve/resolveSnowflake.js";

export function toChannelMention(resolvable: Optional<CanBeSnowflakeResolvable>): string | undefined {
	const id = resolveSnowflake(resolvable);
	return id ? channelMention(id) : undefined;
}
