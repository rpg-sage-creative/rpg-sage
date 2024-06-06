import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { Formatters } from "discord.js";

export function toChannelMention(id: Optional<Snowflake>): string | null {
	return id ? Formatters.channelMention(id) : null;
}