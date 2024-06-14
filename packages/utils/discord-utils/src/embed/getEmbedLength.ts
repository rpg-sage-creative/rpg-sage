import { embedLength } from "discord.js";
import { type EmbedResolvable } from "./EmbedResolvable.js";
import { resolveEmbed } from "./resolveEmbed.js";

export function getEmbedLength(embed: EmbedResolvable): number {
	return embedLength(resolveEmbed(embed));
}