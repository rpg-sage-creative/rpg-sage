import { ColorResolvable, EmbedBuilder, embedLength as getEmbedLength } from "discord.js";
import type { Optional } from "..";
import type { TRenderableContentResolvable, TRenderableContentSection } from "../RenderUtils";
import { RenderableContent, TDisplayType } from "../RenderUtils";
import { chunk } from "../StringUtils";
import { DiscordMaxValues } from "./consts";

/*
To add a blank field to the embed, you can use .addFields({ name: '\u200b', value: '\u200b' }).
*/

/** Ensures we have a string, prepending a NewLine if needed. */
function getValueToAppend(value: Optional<string>, newLine: boolean): string {
	return `${newLine ? "\n" : ""}${value ?? ""}`;
}

type ContentFormatter = (content: string) => string;

/** Resolves a simple text section. */
function resolveSection(renderableContent: RenderableContent, formatter: ContentFormatter, embeds: EmbedBuilder[], section: TRenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	const joinedContent = section.content.join(renderableContent.paragraphDelimiter),
		formattedContent = formatter(joinedContent),
		// We want the first chunk to be short enough to fit in the previous embed
		maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? DiscordMaxValues.embed.descriptionLength - renderableContent.paragraphDelimiter.length - getEmbedLength(embed.data) : DiscordMaxValues.embed.descriptionLength,
		chunkedContent = chunk(formattedContent, maxChunkLengthCallback);

	chunkedContent.forEach((chunk, index) => {
		if (index === 0) {
			embed.setDescription((embed.data.description ?? "") + renderableContent.paragraphDelimiter + chunk);
		}else {
			embed = createMessageEmbed(undefined, chunk, renderableContent.color);
			embeds.push(embed);
		}
	});
}

function reachedMaxFieldCount(embed: EmbedBuilder): boolean {
	return embed.data.fields?.length === DiscordMaxValues.embed.field.count;
}
function reachedMaxEmbedLength(embed: EmbedBuilder, additionalLength: number): boolean {
	const embedLength = getEmbedLength(embed.data);
	return embedLength + additionalLength > DiscordMaxValues.embed.totalLength;
}

/** Resolves a section that has columns. */
function resolveColumnedSection(renderableContent: RenderableContent, formatter: ContentFormatter, embeds: EmbedBuilder[], columnedSection: TRenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	columnedSection.columns.forEach(column => {
		const formattedTitle = formatter(column.title),
			formattedContent = formatter(column.content);
		if (reachedMaxFieldCount(embed) || reachedMaxEmbedLength(embed, formattedTitle.length + formattedContent.length)) {
			embed = createMessageEmbed(undefined, undefined, renderableContent.color);
			embeds.push(embed);
		}
		embed.addFields({ name:formattedTitle, value:formattedContent, inline:true });
	});
}

/** Resolves a section that has a title. */
function resolveTitledSection(renderableContent: RenderableContent, formatter: ContentFormatter, embeds: EmbedBuilder[], titledSection: TRenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	const formattedTitle = formatter(titledSection.title ?? ""),
		joinedContent = titledSection.content.join(renderableContent.paragraphDelimiter),
		formattedContent = formatter(joinedContent),
		// We want the first chunk to be short enough to fit in a field, which we use to add the title
		maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? DiscordMaxValues.embed.field.valueLength : DiscordMaxValues.embed.descriptionLength,
		chunkedContent = chunk(formattedContent, maxChunkLengthCallback);

	chunkedContent.forEach((chunk, index) => {
		if (index === 0) {
			// We need to add a field for the first chunk so that we can add a title
			if (reachedMaxFieldCount(embed) || reachedMaxEmbedLength(embed, formattedTitle.length + chunk.length)) {
				embed = createMessageEmbed(undefined, undefined, renderableContent.color);
				embeds.push(embed);
			}
			embed.addFields({ name:formattedTitle, value:chunk });
		}else {
			// Subsequent chunks don't need a title so we can just create a new embed
			embed = createMessageEmbed(undefined, chunk, renderableContent.color);
			embeds.push(embed);
		}
	});
}

function resolveSections(renderableContent: RenderableContent, formatter: ContentFormatter, embeds: EmbedBuilder[]): void {
	for (const section of renderableContent.sections) {
		if (section.title) {
			resolveTitledSection(renderableContent, formatter, embeds, section);
		}else if (section.columns?.length) {
			resolveColumnedSection(renderableContent, formatter, embeds, section);
		}else {
			resolveSection(renderableContent, formatter, embeds, section);
		}
	}
}

/** Converts the given renderableContent to MessageEmbed objects, using the given caches. */
export function resolveToEmbeds(renderableContentResolvable: TRenderableContentResolvable, formatter: ContentFormatter): EmbedBuilder[] {
	const renderableContent = RenderableContent.resolve(renderableContentResolvable);
	if (!renderableContent) {
		return [];
	}

	const embed = createMessageEmbed(undefined, undefined, renderableContent.color);

	const title = formatter(renderableContent.title ?? "");
	if (renderableContent.display === TDisplayType.Compact && title && renderableContent.thumbnailUrl) {
		embed.setAuthor({ name:title, url:renderableContent.thumbnailUrl });
	}else {
		if (title) {
			embed.setTitle(title);
		}
		if (renderableContent.thumbnailUrl) {
			embed.setThumbnail(renderableContent.thumbnailUrl);
		}
	}

	const embeds = [embed];
	resolveSections(renderableContent, formatter, embeds);
	return embeds;
}

export function embedsToTexts(embeds: EmbedBuilder[]): string[] {
	return embeds.map(embed => {
		let text = "";
		/** @todo look into using "h3" (###) for title */
		text += getValueToAppend(embed.data.title, !!text);
		text += getValueToAppend(embed.data.description, !!text);
		if (embed.data.fields?.length) {
			embed.data.fields.forEach(field => {
			/** @todo look into using "h3" (###) for name */
				text += getValueToAppend(field.name, !!text);
				text += getValueToAppend(field.value, !!text);
			});
		}
		return text;
	});
}

/** Converts RenderableContent to embeds and then to lines of simple text with markup. */
export function resolveToTexts(renderableContent: TRenderableContentResolvable, formatter: ContentFormatter): string[] {
	const embeds = resolveToEmbeds(renderableContent, formatter);
	return embedsToTexts(embeds);
}

/** Creates a new MessageEmbed, setting the title, description, and color if given. */
export function createMessageEmbed(title?: Optional<string>, description?: Optional<string>, color?: Optional<string>): EmbedBuilder {
	const embed = new EmbedBuilder();

	if (title) {
		if (title.length > DiscordMaxValues.embed.titleLength) {
			console.warn(`MessageEmbed.title too long (${title.length}/${DiscordMaxValues.embed.titleLength}): ${title}`);
			title = title.slice(0, DiscordMaxValues.embed.titleLength);
		}
		embed.setTitle(title);
	}

	if (description) {
		if (description.length > DiscordMaxValues.embed.descriptionLength) {
			console.warn(`MessageEmbed.description too long (${description.length}/${DiscordMaxValues.embed.descriptionLength}): ${description}`);
			description = description.slice(0, DiscordMaxValues.embed.descriptionLength);
		}
		embed.setDescription(description);
	}

	if (color) {
		try {
			const colorResolvable = color.startsWith("0x") ? Number(color) : color as ColorResolvable;
			embed.setColor(colorResolvable);
		}catch(ex) {
			console.warn(`Invalid DiscordColor: ${JSON.stringify({color})}`);
		}
	}

	return embed;
}
