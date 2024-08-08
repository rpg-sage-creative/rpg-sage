import type { Optional } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "../types/DiscordMaxValues.js";
import type { EmbedBuilder } from "./EmbedBuilder.js";
import { getEmbedLength } from "./getEmbedLength.js";
import { getTotalEmbedLength } from "./getTotalEmbedLength.js";

/** Pushes an embed to an array only if the resulting array is within allowed embed length limits. */
export function pushIfValid(embeds: EmbedBuilder[], embed: Optional<EmbedBuilder>): boolean {
	if (embed) {
		const currentLength = getTotalEmbedLength(embeds);
		const length = getEmbedLength(embed);
		if (currentLength + length < DiscordMaxValues.embed.totalLength) {
			embeds.push(embed);
			return true;
		}
	}
	return false;
}