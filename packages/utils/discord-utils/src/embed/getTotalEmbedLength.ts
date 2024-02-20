import type { EmbedResolvable } from "./EmbedResolvable.js";
import { getEmbedLength } from "./getEmbedLength.js";

export function getTotalEmbedLength(embeds?: EmbedResolvable[]): number {
	return embeds?.reduce((total, embed) => total + getEmbedLength(embed), 0) ?? 0;
}