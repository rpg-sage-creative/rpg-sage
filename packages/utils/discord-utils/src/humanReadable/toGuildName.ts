import type { Optional } from "@rsc-utils/core-utils";
import type { Guild, GuildPreview } from "discord.js";

type GuildResolvable = Guild | GuildPreview;

/** Returns the guild name or "UnknownGuild" */
export function toGuildName(guild: Optional<GuildResolvable>): string {
	return guild?.name ?? "UnknownGuild";
}