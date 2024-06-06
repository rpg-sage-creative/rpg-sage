import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { Formatters } from "discord.js";

export function toRoleMention(id: Optional<Snowflake>): string | null {
	return id ? Formatters.roleMention(id) : null;
}