import { type Optional } from "@rsc-utils/core-utils";
import { userMention } from "discord.js";
import { resolveSnowflake, type SnowflakeResolvable } from "../resolveSnowflake.js";

export function toUserMention(resolvable: Optional<SnowflakeResolvable>): string | undefined {
	const id = resolveSnowflake(resolvable);
	return id ? userMention(id) : undefined;
}