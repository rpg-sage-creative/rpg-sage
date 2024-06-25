import { type Optional } from "@rsc-utils/core-utils";
import { userMention } from "discord.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable } from "../resolve/resolveSnowflake.js";

export function toUserMention(resolvable: Optional<CanBeSnowflakeResolvable>): string | undefined {
	const id = resolveSnowflake(resolvable);
	return id ? userMention(id) : undefined;
}