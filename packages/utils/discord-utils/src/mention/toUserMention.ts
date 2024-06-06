import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { Formatters } from "discord.js";

export function toUserMention(id: Optional<Snowflake>): string | null {
	return id ? Formatters.userMention(id) : null;
}