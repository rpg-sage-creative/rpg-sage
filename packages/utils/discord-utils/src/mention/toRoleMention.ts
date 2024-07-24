import { type Optional } from "@rsc-utils/core-utils";
import { roleMention } from "discord.js";
import { resolveSnowflake, type SnowflakeResolvable } from "../resolve/resolveSnowflake.js";

export function toRoleMention(resolvable: Optional<SnowflakeResolvable>): string | undefined {
	const id = resolveSnowflake(resolvable);
	return id ? roleMention(id) : undefined;
}