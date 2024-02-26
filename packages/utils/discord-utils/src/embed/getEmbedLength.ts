import type { EmbedResolvable } from "./EmbedResolvable.js";

export function getEmbedLength(embed: EmbedResolvable): number {
	if ("length" in embed) {
		return embed.length;
	}

	let total = 0;

	total += embed.title?.length ?? 0;
	total += embed.description?.length ?? 0;
	total += embed.footer?.text?.length ?? 0;
	total += embed.author?.name?.length ?? 0;

	const fields = embed.fields ?? [];
	for (const field of fields) {
		const fieldNameLength = field.name.length;
		const fieldValueLength = field.value.length;
		total += fieldNameLength + fieldValueLength;
	}

	return total;
}