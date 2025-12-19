import type { Optional } from "@rsc-utils/core-utils";
import { GuildMember, User, userMention } from "discord.js";
import { resolveSnowflake, type SnowflakeResolvable } from "../resolve/resolveSnowflake.js";

export function toUserMention(resolvable: SnowflakeResolvable | GuildMember | User): string;
export function toUserMention(resolvable: Optional<SnowflakeResolvable | GuildMember | User>): string | undefined;
export function toUserMention(resolvable: Optional<SnowflakeResolvable | GuildMember | User>): string | undefined {
	const id = resolveSnowflake(resolvable);
	return id ? userMention(id) : undefined;
}