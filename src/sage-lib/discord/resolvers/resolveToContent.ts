import type { RenderableContentResolvable } from "@rsc-utils/core-utils";
import { resolveEmbed, type EmbedResolvable } from "@rsc-utils/discord-utils";
import type { SyncDialogContentFormatter } from "../../sage/commands/dialog/chat/DialogProcessor.js";
import { getValueToAppend } from "./getValueToAppend.js";
import { resolveToEmbeds } from "./resolveToEmbeds.js";

function embedsToTexts(embeds: EmbedResolvable[]): string[] {
	return embeds.map(embedResolvable => {
		const embed = resolveEmbed(embedResolvable);
		let text = "";
		text += getValueToAppend(embed.title, !!text);
		text += getValueToAppend(embed.description, !!text);
		if (embed.fields?.length) {
			embed.fields.forEach(field => {
				text += getValueToAppend(field.name, !!text);
				text += getValueToAppend(field.value, !!text);
			});
		}
		return text;
	});
}

/** Converts RenderableContent to embeds and then to lines of simple text with markup. */
export function resolveToContent(resolvable: RenderableContentResolvable, formatter: SyncDialogContentFormatter): string[] {
	const embeds = resolveToEmbeds(resolvable, formatter);
	return embedsToTexts(embeds);
}
