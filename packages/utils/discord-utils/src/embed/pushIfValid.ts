import type { Optional } from "@rsc-utils/core-utils";
import { DiscordMaxValues } from "../types/DiscordMaxValues.js";
import type { EmbedBuilder } from "./EmbedBuilder.js";
import { getEmbedLength } from "./getEmbedLength.js";
import { getTotalEmbedLength } from "./getTotalEmbedLength.js";

/**
 * Pushes an embed to an array only if the resulting array is within allowed embed length limits.
 * @returns number of items pushed
 */
export function pushIfValid(array: EmbedBuilder[], ...embeds: Optional<EmbedBuilder>[]): number {
	let pushed = 0;
	for (const embed of embeds) {
		if (embed && array.length < DiscordMaxValues.message.embedCount) {
			const currentLength = getTotalEmbedLength(array);
			const length = getEmbedLength(embed);
			if (currentLength + length < DiscordMaxValues.embed.totalLength) {
				array.push(embed);
				pushed++;
			}
		}
	}
	return pushed;
}