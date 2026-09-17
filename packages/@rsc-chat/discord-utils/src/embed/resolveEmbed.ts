import type { APIEmbed } from "discord.js";
import type { EmbedResolvable } from "./EmbedResolvable.js";

/** Ensures we have an APIEmbed */
export function resolveEmbed(resolvable: EmbedResolvable): APIEmbed {
	if ("toJSON" in resolvable) {
		return resolvable.toJSON();
	}
	return resolvable;
}