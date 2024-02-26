import type { MessageOptions, WebhookEditMessageOptions, WebhookMessageOptions } from "discord.js";
import { DiscordMaxValues } from "../DiscordMaxValues.js";
import { getTotalEmbedLength } from "../embed/getTotalEmbedLength.js";
import { validateEmbedLengths } from "../embed/validateEmbedLengths.js";

type Options = WebhookMessageOptions | WebhookEditMessageOptions | MessageOptions;

/** Returns true if all lengths of the given options are under the allowed values for a single messge post. */
export function validateMessageOptions<T extends Options>(options: T): boolean {
	const contentLength = options.content?.length ?? 0;
	if (contentLength > DiscordMaxValues.message.contentLength) {
		return false;
	}

	const embeds = options.embeds ?? [];

	if (embeds.length > DiscordMaxValues.message.embedCount) {
		return false;
	}

	const embedTotalLength = getTotalEmbedLength(embeds);
	if (embedTotalLength > DiscordMaxValues.embed.totalLength) {
		return false;
	}

	for (const embed of embeds) {
		if (!validateEmbedLengths(embed)) {
			return false;
		}
	}

	return true;
}