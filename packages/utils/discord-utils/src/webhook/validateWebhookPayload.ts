import type { WebhookEditMessageOptions, WebhookMessageOptions } from "discord.js";
import { DiscordMaxValues } from "../DiscordMaxValues.js";
import { getTotalEmbedLength } from "../embed/getTotalEmbedLength.js";
import { validateEmbedLengths } from "../embed/validateEmbedLengths.js";

export function validateWebhookPayload<T extends WebhookMessageOptions | WebhookEditMessageOptions>(options: T): boolean {
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