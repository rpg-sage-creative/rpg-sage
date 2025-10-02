import { chunk, RenderableContent, type RenderableContentResolvable, type RenderableContentSection } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder, getEmbedFieldCount, getEmbedLength } from "@rsc-utils/discord-utils";
import type { SageCache } from "../../sage/model/SageCache.js";
import { createMessageEmbed } from "../createMessageEmbed.js";

/** Resolves a simple text section. */
function resolveSection(renderableContent: RenderableContent, sageCache: SageCache, embeds: EmbedBuilder[], section: RenderableContentSection): void {
	const previousEmbed = embeds[embeds.length - 1];
	const { descriptionLength } = DiscordMaxValues.embed;
	const { color, paragraphDelimiter } = renderableContent;

	// we want the first chunk to be short enough to fit in the previous embed
	const previousEmbedAvailLength = previousEmbed ? descriptionLength - paragraphDelimiter.length - getEmbedLength(previousEmbed) : descriptionLength;
	const maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? previousEmbedAvailLength : descriptionLength;

	// join and format content
	const joinedContent = section.content.join(paragraphDelimiter);
	let formattedContent = sageCache.format(joinedContent);

	// append formatted title (if title was given)
	const title = section.title?.trim();
	if (title) {
		const formattedTitle = sageCache.format(title);
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
function resolveColumnedSection({ color }: RenderableContent, sageCache: SageCache, embeds: EmbedBuilder[], columnedSection: RenderableContentSection): void {
	let embed = embeds[embeds.length - 1];

	const maxFieldCount = DiscordMaxValues.embed.field.count;
	const maxEmbedLength = DiscordMaxValues.embed.totalLength;

	columnedSection.columns.forEach(column => {
		// get current field count
		const embedFieldCount = getEmbedFieldCount(embed);

		// get updated embed length
		const formattedTitle = sageCache.format(column.title);
		const formattedContent = sageCache.format(column.content);
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

function resolveSections(sageCache: SageCache, renderableContent: RenderableContent, embeds: EmbedBuilder[]): void {
	for (const section of renderableContent.sections) {
		if (section.columns?.length) {
			resolveColumnedSection(renderableContent, sageCache, embeds, section);
		}else {
			resolveSection(renderableContent, sageCache, embeds, section);
		}
	}
}

/** Converts the given renderableContent to MessageEmbed objects, using the given SageCache. */
export function resolveToEmbeds(sageCache: SageCache, renderableContentResolvable: RenderableContentResolvable): EmbedBuilder[] {
	const renderableContent = RenderableContent.resolve(renderableContentResolvable);
	if (!renderableContent) {
		return [];
	}

	const { color, thumbnailUrl } = renderableContent;
	const title = sageCache.format(renderableContent.title ?? "").trim();

	const embed = createMessageEmbed({ title, color, thumbnailUrl });

	const embeds = [embed];
	resolveSections(sageCache, renderableContent, embeds);
	return embeds;
}