import type { Optional } from "@rsc-utils/core-utils";
import { embedLength } from "discord.js";
import { type EmbedResolvable } from "./EmbedResolvable.js";
import { resolveEmbed } from "./resolveEmbed.js";

export function getEmbedLength(embed: Optional<EmbedResolvable>): number {
	return embed ? embedLength(resolveEmbed(embed)) : 0;
}