import type { Optional } from "@rsc-utils/core-utils";
import type { EmbedResolvable } from "./EmbedResolvable.js";
import { resolveEmbed } from "./resolveEmbed.js";

export function getEmbedFieldCount(resolvable: Optional<EmbedResolvable>): number {
	if (!resolvable) return 0;
	const embed = resolveEmbed(resolvable);
	return embed.fields?.length ?? 0;
}