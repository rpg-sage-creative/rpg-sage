import { DiscordMaxValues } from "../DiscordMaxValues.js";
import type { EmbedResolvable } from "./EmbedResolvable.js";
import { getEmbedLength } from "./getEmbedLength.js";

export function validateEmbedLengths(embed: EmbedResolvable): boolean {
	const max = DiscordMaxValues.embed;

	const titleLength = embed.title?.length ?? 0;
	if (titleLength > max.titleLength) {
		return false;
	}

	const descriptionLength = embed.description?.length ?? 0;
	if (descriptionLength > max.descriptionLength) {
		return false;
	}

	const footerTextLength = embed.footer?.text?.length ?? 0;
	if (footerTextLength > max.footerTextLength) {
		return false;
	}

	const authorNameLength = embed.author?.name?.length ?? 0;
	if (authorNameLength > max.authorNameLength) {
		return false;
	}

	const fields = embed.fields ?? [];
	if (fields.length > max.field.count) {
		return false;
	}
	for (const field of fields) {
		const fieldNameLength = field.name.length;
		const fieldValueLength = field.value.length;
		if (fieldNameLength > max.field.nameLength || fieldValueLength > max.field.valueLength) {
			return false;
		}
	}

	if (getEmbedLength(embed) > max.totalLength) {
		return false;
	}

	return true;
}