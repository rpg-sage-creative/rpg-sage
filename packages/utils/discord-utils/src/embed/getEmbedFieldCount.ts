import type { Optional } from "@rsc-utils/core-utils";
import type { EmbedResolvable } from "./EmbedResolvable.js";
import { resolveEmbed } from "./resolveEmbed.js";

/** Counts the fields in the given EmbedResolvable, returning 0 if one wasn't given. */
export function getEmbedFieldCount(resolvable: Optional<EmbedResolvable>): number {
	if (resolvable) {
		const embed = resolveEmbed(resolvable);
		return embed.fields?.length ?? 0;
	}
	return 0;
}