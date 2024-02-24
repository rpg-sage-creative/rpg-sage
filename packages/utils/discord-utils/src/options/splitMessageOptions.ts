import { chunk } from "@rsc-utils/string-utils";
import type { MessageOptions, WebhookEditMessageOptions, WebhookMessageOptions } from "discord.js";
import { DiscordMaxValues } from "../DiscordMaxValues.js";
import type { EmbedResolvable } from "../embed/EmbedResolvable.js";
import { getEmbedLength } from "../embed/getEmbedLength.js";
import { getTotalEmbedLength } from "../embed/getTotalEmbedLength.js";

type Options = WebhookMessageOptions | WebhookEditMessageOptions | MessageOptions;

/** Used to convert a single message options object into an array to ensure we don't break posting limits. */
export function splitMessageOptions<T extends Options>(options: T): T[] {
	// break out the content, embeds, and files; saving the remaining options to be used in each payload
	const { content, embeds, files, ...baseOptions } = options;

	const payloads: T[] = [];

	// chunk content into valid lengths
	const contentChunks = content ? chunk(content, DiscordMaxValues.message.contentLength) : [];

	// create a payload for each chunk
	contentChunks.forEach(contentChunk => {
		payloads.push({
			content: contentChunk,
			embeds: [] as EmbedResolvable[],
			...baseOptions
		} as T);
	});

	// iterate the embeds
	embeds?.forEach(embed => {
		// get the length of the embed to add
		const embedLength = getEmbedLength(embed);

		// grab the last payload to see if we can add to it
		const payload = payloads[payloads.length - 1];
		if (payload) {
			// get the length of the existing embeds
			const embedsLength = getTotalEmbedLength(payload.embeds);

			// if we have enough characters left, then add the add
			if (embedsLength + embedLength < DiscordMaxValues.embed.totalLength) {
				payload.embeds!.push(embed);

			// create a new embed
			}else {
				payloads.push({ embeds:[embed], ...baseOptions } as T);
			}

		// no payload, create a new one
		}else {
			payloads.push({ embeds:[embed], ...baseOptions } as T);
		}
	});

	// only include files in the first payload
	payloads[0].files = files;

	return payloads;
}