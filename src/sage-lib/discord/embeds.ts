import { warn } from "@rsc-utils/console-utils";
import type { Optional } from "@rsc-utils/type-utils";
import * as Discord from "discord.js";
import utils, { TDisplayType, TRenderableContentSection } from "../../sage-utils";
import type SageCache from "../sage/model/SageCache";
import { DiscordMaxValues } from "./consts";
import type { TRenderableContentResolvable } from "./types";


/** Ensures we have a string, prepending a NewLine if needed. */
function getValueToAppend(value: string | null, newLine: boolean): string {
	return `${newLine ? "\n" : ""}${value ?? ""}`;
}

/** Resolves a simple text section. */
function resolveSection(renderableContent: utils.RenderUtils.RenderableContent, caches: SageCache, embeds: Discord.MessageEmbed[], section: TRenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	const joinedContent = section.content.join(renderableContent.paragraphDelimiter),
		formattedContent = caches.format(joinedContent),
		// We want the first chunk to be short enough to fit in the previous embed
		maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? DiscordMaxValues.embed.descriptionLength - renderableContent.paragraphDelimiter.length - embed.length : DiscordMaxValues.embed.descriptionLength,
		chunkedContent = utils.StringUtils.chunk(formattedContent, maxChunkLengthCallback);

	chunkedContent.forEach((chunk, index) => {
		if (index === 0) {
			embed.description = (embed.description ?? "") + renderableContent.paragraphDelimiter + chunk;
		}else {
			embed = createMessageEmbed(undefined, chunk, renderableContent.color);
			embeds.push(embed);
		}
	});
}

/** Resolves a section that has columns. */
function resolveColumnedSection(renderableContent: utils.RenderUtils.RenderableContent, caches: SageCache, embeds: Discord.MessageEmbed[], columnedSection: TRenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	columnedSection.columns.forEach(column => {
		const formattedTitle = caches.format(column.title),
			formattedContent = caches.format(column.content);
		if (embed.fields.length === DiscordMaxValues.embed.field.count
				|| embed.length + formattedTitle.length + formattedContent.length > DiscordMaxValues.embed.totalLength) {
			embed = createMessageEmbed(undefined, undefined, renderableContent.color);
			embeds.push(embed);
		}
		embed.addFields({ name:formattedTitle, value:formattedContent, inline:true });
	});
}

/** Resolves a section that has a title. */
function resolveTitledSection(renderableContent: utils.RenderUtils.RenderableContent, caches: SageCache, embeds: Discord.MessageEmbed[], titledSection: TRenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	const formattedTitle = caches.format(titledSection.title ?? ""),
		joinedContent = titledSection.content.join(renderableContent.paragraphDelimiter),
		formattedContent = caches.format(joinedContent),
		// We want the first chunk to be short enough to fit in a field, which we use to add the title
		maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? DiscordMaxValues.embed.field.valueLength : DiscordMaxValues.embed.descriptionLength,
		chunkedContent = utils.StringUtils.chunk(formattedContent, maxChunkLengthCallback);

	chunkedContent.forEach((chunk, index) => {
		if (index === 0) {
			// We need to add a field for the first chunk so that we can add a title
			if (embed.fields.length === DiscordMaxValues.embed.field.count
					|| embed.length + formattedTitle.length + chunk.length > DiscordMaxValues.embed.totalLength) {
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

function resolveSections(caches: SageCache, renderableContent: utils.RenderUtils.RenderableContent, embeds: Discord.MessageEmbed[]): void {
	for (const section of renderableContent.sections) {
		if (section.title) {
			resolveTitledSection(renderableContent, caches, embeds, section);
		}else if (section.columns?.length) {
			resolveColumnedSection(renderableContent, caches, embeds, section);
		}else {
			resolveSection(renderableContent, caches, embeds, section);
		}
	}
}

/** Converts the given renderableContent to MessageEmbed objects, using the given caches. */
export function resolveToEmbeds(caches: SageCache, renderableContentResolvable: TRenderableContentResolvable): Discord.MessageEmbed[] {
	const renderableContent = utils.RenderUtils.RenderableContent.resolve(renderableContentResolvable);
	if (!renderableContent) {
		return [];
	}

	const embed: Discord.MessageEmbed = createMessageEmbed(undefined, undefined, <Discord.HexColorString>renderableContent.color);

	const title = caches.format(renderableContent.title ?? "");
	if (renderableContent.display === TDisplayType.Compact && title && renderableContent.thumbnailUrl) {
		embed.setAuthor(title, renderableContent.thumbnailUrl);
	}else {
		if (title) {
			embed.setTitle(title);
		}
		if (renderableContent.thumbnailUrl) {
			embed.setThumbnail(renderableContent.thumbnailUrl);
		}
	}

	const embeds = [embed];
	resolveSections(caches, renderableContent, embeds);
	return embeds;
}

export function embedsToTexts(embeds: Discord.MessageEmbed[]): string[] {
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
export function resolveToTexts(caches: SageCache, renderableContent: TRenderableContentResolvable): string[] {
	const embeds = resolveToEmbeds(caches, renderableContent);
	return embedsToTexts(embeds);
}

/** Creates a new MessageEmbed, setting the title, description, and color if given. */
export function createMessageEmbed(title?: Optional<string>, description?: Optional<string>, color?: Optional<string>): Discord.MessageEmbed {
	const embed = new Discord.MessageEmbed();

	if (title) {
		if (title.length > DiscordMaxValues.embed.titleLength) {
			warn(`MessageEmbed.title too long (${title.length}/${DiscordMaxValues.embed.titleLength}): ${title}`);
			title = title.slice(0, DiscordMaxValues.embed.titleLength);
		}
		embed.setTitle(title);
	}

	if (description) {
		if (description.length > DiscordMaxValues.embed.descriptionLength) {
			warn(`MessageEmbed.description too long (${description.length}/${DiscordMaxValues.embed.descriptionLength}): ${description}`);
			description = description.slice(0, DiscordMaxValues.embed.descriptionLength);
		}
		embed.setDescription(description);
	}

	if (color) {
		embed.setColor(<Discord.ColorResolvable>color);
	}

	return embed;
}
