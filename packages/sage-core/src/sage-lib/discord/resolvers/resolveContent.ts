import { chunk, RenderableContent, type RenderableContentResolvable, type RenderableContentSection } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder, getEmbedFieldCount, getEmbedLength, resolveEmbed, type EmbedResolvable } from "@rsc-utils/discord-utils";
import { createMessageEmbed } from "../createMessageEmbed.js";
import { getValueToAppend } from "./getValueToAppend.js";
import type { ContentFormatter } from "../../sage/model/SageEventCache.js";

type ResolveSectionOptions = { embeds:EmbedBuilder[]; formatter:ContentFormatter; renderableContent:RenderableContent; section:RenderableContentSection; };

/** Resolves a simple text section. */
function resolveSection({ embeds, formatter, renderableContent, section }: ResolveSectionOptions): void {
	const previousEmbed = embeds[embeds.length - 1];
	const { descriptionLength } = DiscordMaxValues.embed;
	const { color, paragraphDelimiter } = renderableContent;

	// we want the first chunk to be short enough to fit in the previous embed
	const previousEmbedAvailLength = previousEmbed ? descriptionLength - paragraphDelimiter.length - getEmbedLength(previousEmbed) : descriptionLength;
	const maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? previousEmbedAvailLength : descriptionLength;

	// join and format content
	let formattedContent = formatter(section.content.join(paragraphDelimiter));

	// append formatted title (if title was given)
	const title = section.title?.trim();
	if (title) {
		const formattedTitle = formatter(title);
		formattedContent = `### ${formattedTitle}${paragraphDelimiter}${formattedContent}`;
	}

	// chunk content
	const chunkedContent = chunk(formattedContent, { maxChunkLength:maxChunkLengthCallback });

	// append to previous embeds or add new ones
	chunkedContent.forEach((description, index) => {
		// we append to the previously existing embed only if this is our first chunk *and* we already have an embed
		if (index === 0 && previousEmbed) {
			previousEmbed.appendDescription(description, paragraphDelimiter);
		}else {
			embeds.push(createMessageEmbed({ description, color }));
		}
	});
}

/** Resolves a section that has columns. */
function resolveColumnedSection({ embeds, formatter, renderableContent:{ color }, section }: ResolveSectionOptions): void {
	let embed = embeds[embeds.length - 1];

	const maxFieldCount = DiscordMaxValues.embed.field.count;
	const maxEmbedLength = DiscordMaxValues.embed.totalLength;

	section.columns.forEach(column => {
		// get current field count
		const embedFieldCount = getEmbedFieldCount(embed);

		// get updated embed length
		const formattedTitle = formatter(column.title);
		const formattedContent = formatter(column.content);
		const embedTotalLength = getEmbedLength(embed) + formattedTitle.length + formattedContent.length;

		// if we don't have an embed, or it has max fields, or the expected length would be too long ... start a new embed
		if (!embed || embedFieldCount === maxFieldCount || embedTotalLength > maxEmbedLength) {
			embed = createMessageEmbed({ color });
			embeds.push(embed);
		}

		// add the column to the embed as a field
		embed.addFields({ name:formattedTitle, value:formattedContent, inline:true });
	});
}

/** Converts the given renderableContent to MessageEmbed objects, using the given SageCache. */
function resolveToEmbeds(resolvable: RenderableContentResolvable, formatter: ContentFormatter): EmbedBuilder[] {
	const renderableContent = RenderableContent.resolve(resolvable);
	if (!renderableContent) {
		return [];
	}

	const { color, thumbnailUrl } = renderableContent;
	const title = formatter(renderableContent.title);

	const embed = createMessageEmbed({ title, color, thumbnailUrl });

	const embeds = [embed];
	for (const section of renderableContent.sections) {
		const resolver = section.columns?.length ? resolveColumnedSection : resolveSection;
		resolver({ embeds, formatter, renderableContent, section });
	}
	return embeds;
}

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

export function resolveContent(resolvable: RenderableContentResolvable, formatter: ContentFormatter, target: "embed"): EmbedBuilder[];
export function resolveContent(resolvable: RenderableContentResolvable, formatter: ContentFormatter, target: "text"): string[];
export function resolveContent(resolvable: RenderableContentResolvable, formatter: ContentFormatter, target: "embed" | "text") {
	const embeds = resolveToEmbeds(resolvable, formatter);
	if (target === "embed") return embeds;
	return embedsToTexts(embeds);
}