import { type Optional } from "@rsc-utils/core-utils";
import { channelMention } from "discord.js";
import { resolveSnowflake, type SnowflakeResolvable } from "../resolveSnowflake.js";

export function toChannelMention(resolvable: Optional<SnowflakeResolvable>): string | undefined {
	const id = resolveSnowflake(resolvable);
	return id ? channelMention(id) : undefined;
}
