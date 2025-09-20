import { RenderableContent, type RenderableContentResolvable, type RenderableContentSection } from "@rsc-utils/core-utils";
import { DiscordMaxValues, EmbedBuilder, getEmbedFieldCount, getEmbedLength } from "@rsc-utils/discord-utils";
import { chunk } from "@rsc-utils/string-utils";
import type { SyncDialogContentFormatter } from "../../sage/commands/dialog/chat/DialogProcessor.js";
import { createMessageEmbed } from "../createMessageEmbed.js";

type ResolveSectionOptions = { embeds:EmbedBuilder[]; formatter:SyncDialogContentFormatter; renderableContent:RenderableContent; section:RenderableContentSection; };

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
	const chunkedContent = chunk(formattedContent, maxChunkLengthCallback);

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
export function resolveToEmbeds(resolvable: RenderableContentResolvable, formatter: SyncDialogContentFormatter): EmbedBuilder[] {
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