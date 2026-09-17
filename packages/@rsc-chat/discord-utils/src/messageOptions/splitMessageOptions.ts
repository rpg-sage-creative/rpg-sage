import { chunk, isNotBlank, type Optional } from "@rsc-utils/core-utils";
import { type APIEmbed, type ColorResolvable, type Embed, type MessageCreateOptions, type MessageEditOptions, resolveColor, type WebhookMessageCreateOptions, type WebhookMessageEditOptions } from "discord.js";
import { EmbedBuilder } from "../embed/EmbedBuilder.js";
import type { EmbedResolvable } from "../embed/EmbedResolvable.js";
import { getEmbedLength } from "../embed/getEmbedLength.js";
import { getTotalEmbedLength } from "../embed/getTotalEmbedLength.js";
import { resolveEmbed } from "../embed/resolveEmbed.js";
import { DiscordMaxValues } from "../types/DiscordMaxValues.js";

type MessageOptions = MessageCreateOptions | MessageEditOptions | WebhookMessageCreateOptions | WebhookMessageEditOptions;
type SplitMessageOptions<T extends MessageOptions> = T & { embedContent?:string; replyingTo?:string; };

export type SplitOptions = {
	/** Use in place of blank content (null, undefined, empty string, whitespcae only), ie: ZERO_WIDTH_SPACE */
	blankContentValue?: string;
	/** Convert all content to embeds? */
	contentToEmbeds?: boolean;
	/** Convert all embeds to content? */
	embedsToContent?: boolean;
	/** Color of the embed */
	embedColor?: ColorResolvable;
};

type MsgEmbed = Embed | APIEmbed;

/** Ensures we have a string, prepending a NewLine or title markdown if needed. */
function getValueToAppend(value?: Optional<string>, newLine?: boolean, title?: boolean): string {
	const titleOut = isNotBlank(value) && title ? "### " : "";
	const newLineOut = newLine ? "\n" : "";
	const valueOut = value?.trim() ?? "";
	return titleOut + newLineOut + valueOut;
}

/** Converts embeds into content. */
function embedsToContent(embeds?: Optional<MsgEmbed[]>): string | undefined {
	// map the embeds to content and join them
	const content = embeds?.map(_embed => {
		const embed = resolveEmbed(_embed);

		let text = "";

		text += getValueToAppend(embed.title, false, true);
		let newLine = text.length > 0;

		text += getValueToAppend(embed.description, newLine);
		newLine ||= text.length > 0;

		embed.fields?.forEach(field => {
			text += getValueToAppend(field.name, newLine, true);
			newLine ||= text.length > 0;

			text += getValueToAppend(field.value, newLine);
			newLine ||= text.length > 0;
		});
		return text;
	}).join("\n\n");

	// return undefined if we have a blank string
	return content?.trim()
		? content
		: undefined;
}

/** Converts content into embeds. */
function contentToEmbeds(content?: Optional<string>, colorResolvable?: ColorResolvable): EmbedBuilder[] | undefined {
	const trimmedContent = content?.trim();
	if (trimmedContent?.length) {
		const chunks = chunk(trimmedContent, { maxChunkLength:DiscordMaxValues.embed.descriptionLength });
		if (chunks.length) {
			const color = colorResolvable ? resolveColor(colorResolvable) : undefined;
			return chunks.map(description => new EmbedBuilder({ color, description }));
		}
	}
	return undefined;
}

/** Merges embeds into content. */
function mergeContent(content?: Optional<string>, embeds?: Optional<MsgEmbed[]>): string | undefined {
	// get embed content
	const embedContent = embedsToContent(embeds);

	// get has flags
	const hasContent = !!content?.trim();
	const hasEmbedContent = !!embedContent?.trim();

	// return non blank output
	if (hasContent && hasEmbedContent) {
		return `${content}\n\n${embedContent}`;
	}else if (hasEmbedContent) {
		return embedContent!;
	}else if (hasContent) {
		return content!;
	}

	// return undefined to avoid sending an empty string as content
	return undefined;
}

/** Merges content into embeds */
function mergeEmbeds(content?: Optional<string>, embeds?: Optional<MsgEmbed[]>, color?: ColorResolvable): EmbedBuilder[] | undefined {
	const hasEmbeds = !!embeds?.length;

	// get content embeds
	const embedColor = hasEmbeds ? resolveEmbed(embeds[0]!).color as ColorResolvable : undefined;
	const contentEmbeds = contentToEmbeds(content, embedColor ?? color);
	const hasContentEmbeds = !!contentEmbeds?.length;

	// return defined embeds
	if (hasContentEmbeds && hasEmbeds) {
		return contentEmbeds.concat(embeds as EmbedBuilder[]);
	}else if (hasContentEmbeds) {
		return contentEmbeds;
	}else if (hasEmbeds) {
		return embeds as EmbedBuilder[];
	}

	// return undefined to avoid sending an invalid array
	return undefined;
}

/** Used to convert a single message options object into an array to ensure we don't break posting limits. */
export function splitMessageOptions<T extends MessageOptions>(msgOptions: SplitMessageOptions<T>, splitOptions?: SplitOptions): T[] {
	// break out the content, embeds, and files; saving the remaining options to be used in each payload
	const { components, content, embedContent, embeds, files, replyingTo, ...baseOptions } = msgOptions;

	// let's do some name maintenance here ...
	if ("username" in baseOptions) {
		const { username } = baseOptions;
		if (typeof(username) === "string") {
			if (username.length > DiscordMaxValues.webhook.username.maxLength) {
				baseOptions.username = `${username.slice(0, 79)}…`;
			}
		}
	}

	// convert incoming embedContent to embeds
	const convertedEmbeds = contentToEmbeds(embedContent, splitOptions?.embedColor) as MsgEmbed[] ?? [];

	// merge those with other incoming embeds
	const allIncomingEmbeds = convertedEmbeds.concat(embeds as MsgEmbed[] ?? []);

	let contentToChunk: string | undefined;
	let embedsToPost: EmbedBuilder[] | undefined;

	if (splitOptions?.embedsToContent) {
		// merge the incoming content with the embeds
		contentToChunk = mergeContent(content, allIncomingEmbeds);

	}else if (splitOptions?.contentToEmbeds) {
		// merge the content into the embeds
		embedsToPost = mergeEmbeds(content, allIncomingEmbeds, splitOptions.embedColor);

	}else {
		contentToChunk = content ?? undefined;
		embedsToPost = allIncomingEmbeds as EmbedBuilder[];
	}

	if (replyingTo && contentToChunk) {
		contentToChunk = `${replyingTo}\n\n${contentToChunk}`;
	}

	const payloads: T[] = [];

	// chunk content into valid lengths
	const contentChunks = chunk(contentToChunk?.trim() ?? "", { maxChunkLength:DiscordMaxValues.message.contentLength });

	// create a payload for each chunk
	contentChunks.forEach(contentChunk => {
		payloads.push({
			content: contentChunk,
			embeds: [],
			...baseOptions as T
		} as T);
	});

	// cannot send an empty string for content
	let blankContent = (contentToChunk ? undefined : replyingTo) ?? splitOptions?.blankContentValue?.trim();
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
			const embedsLength = getTotalEmbedLength([...payload.embeds ?? []]);

			// if we have enough characters left, then add the add
			if (embedsLength + embedLength < DiscordMaxValues.embed.totalLength) {
				(payload.embeds as EmbedResolvable[]).push(embed);

			// create a new embed
			}else {
				payloads.push({ content:blankContent, embeds:[embed], ...baseOptions as T });
			}

		// no payload, create a new one
		}else {
			payloads.push({ content:blankContent, embeds:[embed], ...baseOptions as T });
		}
	});

	// only set components or files /if/ we have them
	if (components?.length || files?.length) {
		// if we somehow don't have a payload, add one
		if (!payloads.length) {
			payloads.push({ ...baseOptions } as T);
		}

		// only include attachments in the first payload
		// payloads[0]!.attachments = attachments;

		// only include components in the first payload
		payloads[0]!.components = components;

		// only include files in the first payload
		payloads[0]!.files = files;
	}

	return payloads;
}