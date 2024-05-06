import type { RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { MessageEmbed } from "discord.js";
import type { SageCache } from "../../sage/model/SageCache.js";
import { getValueToAppend } from "./getValueToAppend.js";
import { resolveToEmbeds } from "./resolveToEmbeds.js";

function embedsToTexts(embeds: MessageEmbed[]): string[] {
	return embeds.map(embed => {
		let text = "";
		text += getValueToAppend(embed.title, !!text);
		text += getValueToAppend(embed.description, !!text);
		if (embed.fields.length) {
			embed.fields.forEach(field => {
				text += getValueToAppend(field.name, !!text);
				text += getValueToAppend(field.value, !!text);
			});
		}
		return text;
	});
}

/** Converts RenderableContent to embeds and then to lines of simple text with markup. */
export function resolveToContent(caches: SageCache, renderableContent: RenderableContentResolvable): string[] {
	const embeds = resolveToEmbeds(caches, renderableContent);
	return embedsToTexts(embeds);
}
