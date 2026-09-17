import type { Optional } from "@rsc-utils/core-utils";
import { embedLength, type APIEmbed } from "discord.js";
import type { EmbedResolvable } from "./EmbedResolvable.js";
import { resolveEmbed } from "./resolveEmbed.js";

/** Returns the length of the given EmbedResolvable, or 0 if we didn't get one. */
export function getEmbedLength(embed: Optional<EmbedResolvable>): number {
	// if we don't have an embed, return 0
	if (!embed) {
		return 0;
	}

	const resolved = resolveEmbed(embed);

	// cleanup the deprecated type to avoid errors with embedLength
	if ("type" in resolved) {
		delete resolved.type;
	}

	return embedLength(resolved as Omit<APIEmbed, "type">);
}