import { chunk } from "@rsc-utils/string-utils";
import { ColorResolvable, MessageEmbed, MessageEmbedOptions, MessageOptions, WebhookEditMessageOptions, WebhookMessageOptions } from "discord.js";
import { DiscordMaxValues } from "../DiscordMaxValues.js";
import type { EmbedResolvable } from "../embed/EmbedResolvable.js";
import { getEmbedLength } from "../embed/getEmbedLength.js";
import { getTotalEmbedLength } from "../embed/getTotalEmbedLength.js";

type MsgOptions = WebhookMessageOptions | WebhookEditMessageOptions | MessageOptions;

type SplitOptions = {
	/** Use in place of blank content (null, undefined, empty string, whitespcae only), ie: ZERO_WIDTH_SPACE */
	blankContentValue?: string;
	/** Convert all content to embeds? */
	contentToEmbeds?: boolean;
	/** Convert all embeds to content? */
	embedsToContent?: boolean;
	/** Color of the embed */
	embedColor?: ColorResolvable;
};

type MsgEmbed = MessageEmbed | MessageEmbedOptions;

/** Ensures we have a string, prepending a NewLine or title markdown if needed. */
function getValueToAppend(value?: string | null, newLine?: boolean, title?: boolean): string {
	return `${title ? "### " : ""}${newLine ? "\n" : ""}${value ?? ""}`;
}

/** Converts embeds into content. */
function embedsToContent(embeds?: MsgEmbed[] | null): string | undefined {
	// map the embeds to content and join them
	const content = embeds?.map(embed => {
		let text = "";
		text += getValueToAppend(embed.title, !!text, true);
		text += getValueToAppend(embed.description, !!text, false);
		if (embed.fields?.length) {
			embed.fields.forEach(field => {
				text += getValueToAppend(field.name, !!text, true);
				text += getValueToAppend(field.value, !!text, false);
			});
		}
		return text;
	}).join("\n\n");

	// return undefined if we have a blank string
	return content?.trim()
		? content
		: undefined;
}

/** Converts content into embeds. */
function contentToEmbeds(content?: string | null, color?: ColorResolvable): MessageEmbed[] | undefined {
	const trimmedContent = content?.trim();
	if (trimmedContent?.length) {
		const chunks = chunk(trimmedContent, DiscordMaxValues.embed.descriptionLength);
		if (chunks.length) {
			return chunks.map(description => new MessageEmbed({ color, description }));
		}
	}
	return undefined;
}

/** Merges embeds into content. */
function mergeContent(content?: string | null, embeds?: MsgEmbed[] | null): string | undefined {
	// get embed content
	const embedContent = embedsToContent(embeds);

	// get has flags
	const hasContent = !!content?.trim();
	const hasEmbedContent = !!embedContent?.trim();

	// return non blank output
	if (hasContent && hasEmbedContent) {
		return `${content}\n\n${hasEmbedContent}`;
	}else if (hasEmbedContent) {
		return embedContent!;
	}else if (hasContent) {
		return content!;
	}

	// return undefined to avoid sending an empty string as content
	return undefined;
}

/** Merges content into embeds */
function mergeEmbeds(content?: string | null, embeds?: MsgEmbed[] | null, color?: ColorResolvable): MessageEmbed[] | undefined {
	// get content embeds
	const contentEmbeds = contentToEmbeds(content, embeds?.[0].color as ColorResolvable ?? color);

	// get has flags
	const hasContentEmbeds = !!contentEmbeds?.length;
	const hasEmbeds = !!embeds?.length;

	// return defined embeds
	if (hasContentEmbeds && hasEmbeds) {
		return contentEmbeds.concat(embeds as MessageEmbed[]);
	}else if (hasContentEmbeds) {
		return contentEmbeds;
	}else if (hasEmbeds) {
		return embeds as MessageEmbed[];
	}

	// return undefined to avoid sending an invalid array
	return undefined;
}

/** Used to convert a single message options object into an array to ensure we don't break posting limits. */
export function splitMessageOptions<T extends MsgOptions>(msgOptions: T, splitOptions?: SplitOptions): T[] {
	// break out the content, embeds, and files; saving the remaining options to be used in each payload
	const { components, content, embeds, files, ...baseOptions } = msgOptions;

	let contentToChunk: string | undefined;
	let embedsToPost: MessageEmbed[] | undefined;

	if (splitOptions?.embedsToContent) {
		// merge the incoming content with the embeds
		contentToChunk = mergeContent(content, embeds as MsgEmbed[]);

	}else if (splitOptions?.contentToEmbeds) {
		// merge the content into the embeds
		embedsToPost = mergeEmbeds(content, embeds as MsgEmbed[], splitOptions.embedColor);

	}else {
		contentToChunk = content ?? undefined;
		embedsToPost = embeds as MessageEmbed[];
	}

	const payloads: T[] = [];

	// chunk content into valid lengths
	const contentChunks = chunk(contentToChunk?.trim() ?? "", DiscordMaxValues.message.contentLength);

	// create a payload for each chunk
	contentChunks.forEach(contentChunk => {
		payloads.push({
			content: contentChunk,
			embeds: [] as EmbedResolvable[],
			...baseOptions
		} as T);
	});

	// cannot send an empty string for content
	let blankContent = splitOptions?.blankContentValue?.trim();
	if (!blankContent?.length) {
		blankContent = undefined; //NOSONAR
	}

	// iterate the embeds
	embedsToPost?.forEach(embed => {
		// get the length of the embed to add
		const embedLength = getEmbedLength(embed);

		// grab the last payload to see if we can add to it
		const payload = payloads[payloads.length - 1];
		if (payload) {
			// get the length of the existing embeds
			const embedsLength = getTotalEmbedLength(payload.embeds);

			// if we have enough characters left, then add the add
			if (embedsLength + embedLength < DiscordMaxValues.embed.totalLength) {
				payload.embeds!.push(embed);

			// create a new embed
			}else {
				payloads.push({ content:blankContent, embeds:[embed], ...baseOptions } as T);
			}

		// no payload, create a new one
		}else {
			payloads.push({ content:blankContent, embeds:[embed], ...baseOptions } as T);
		}
	});

	// only include components in the first payload
	payloads[0].components = components;

	// only include files in the first payload
	payloads[0].files = files;

	return payloads;
}