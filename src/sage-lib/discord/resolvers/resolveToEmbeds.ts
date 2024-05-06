import { DiscordMaxValues } from "@rsc-utils/discord-utils";
import { RenderableContent, type RenderableContentResolvable, type RenderableContentSection } from "@rsc-utils/render-utils";
import { chunk } from "@rsc-utils/string-utils";
import type { MessageEmbed } from "discord.js";
import type { SageCache } from "../../sage/model/SageCache.js";
import { createMessageEmbed } from "../createMessageEmbed.js";

/** Resolves a simple text section. */
function resolveSection(renderableContent: RenderableContent, caches: SageCache, embeds: MessageEmbed[], section: RenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	const joinedContent = section.content.join(renderableContent.paragraphDelimiter),
		formattedContent = caches.format(joinedContent),
		// We want the first chunk to be short enough to fit in the previous embed
		maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? DiscordMaxValues.embed.descriptionLength - renderableContent.paragraphDelimiter.length - embed.length : DiscordMaxValues.embed.descriptionLength,
		chunkedContent = chunk(formattedContent, maxChunkLengthCallback);

	chunkedContent.forEach((chunk, index) => {
		if (index === 0) {
			embed.description = (embed.description ?? "") + renderableContent.paragraphDelimiter + chunk;
		}else {
			embed = createMessageEmbed({ description:chunk, color:renderableContent.color });
			embeds.push(embed);
		}
	});
}

/** Resolves a section that has columns. */
function resolveColumnedSection(renderableContent: RenderableContent, caches: SageCache, embeds: MessageEmbed[], columnedSection: RenderableContentSection): void {
	let embed = embeds[embeds.length - 1];
	columnedSection.columns.forEach(column => {
		const formattedTitle = caches.format(column.title),
			formattedContent = caches.format(column.content);
		if (embed.fields.length === DiscordMaxValues.embed.field.count
				|| embed.length + formattedTitle.length + formattedContent.length > DiscordMaxValues.embed.totalLength) {
			embed = createMessageEmbed({ color:renderableContent.color });
			embeds.push(embed);
		}
		embed.addFields({ name:formattedTitle, value:formattedContent, inline:true });
	});
}

/** Resolves a section that has a title. */
function resolveTitledSection(renderableContent: RenderableContent, caches: SageCache, embeds: MessageEmbed[], titledSection: RenderableContentSection): void {
	let embed = embeds[embeds.length - 1];

	const formattedTitle = caches.format(titledSection.title ?? "");
	const joinedContent = titledSection.content.join(renderableContent.paragraphDelimiter);
	const formattedContent = caches.format(joinedContent);
	const titleAndContent = `### ${formattedTitle}${renderableContent.paragraphDelimiter}${formattedContent}`;
	const maxChunkLengthCallback = (chunkIndex: number) => chunkIndex === 0 ? DiscordMaxValues.embed.descriptionLength - renderableContent.paragraphDelimiter.length - embed.length : DiscordMaxValues.embed.descriptionLength;
	const chunkedContent = chunk(titleAndContent, maxChunkLengthCallback);

	chunkedContent.forEach((chunk, index) => {
		if (index === 0) {
			embed.description = (embed.description ?? "") + renderableContent.paragraphDelimiter + chunk;
		}else {
			embed = createMessageEmbed({ description:chunk, color:renderableContent.color });
			embeds.push(embed);
		}
	});

}

function resolveSections(caches: SageCache, renderableContent: RenderableContent, embeds: MessageEmbed[]): void {
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
export function resolveToEmbeds(caches: SageCache, renderableContentResolvable: RenderableContentResolvable): MessageEmbed[] {
	const renderableContent = RenderableContent.resolve(renderableContentResolvable);
	if (!renderableContent) {
		return [];
	}

	const embed: MessageEmbed = createMessageEmbed({ color:renderableContent.color });

	const title = caches.format(renderableContent.title ?? "");
	if (title) {
		embed.setTitle(title);
	}
	if (renderableContent.thumbnailUrl) {
		embed.setThumbnail(renderableContent.thumbnailUrl);
	}

	const embeds = [embed];
	resolveSections(caches, renderableContent, embeds);
	return embeds;
}