import { error, warn } from "@rsc-utils/console-utils";
import { DiscordMaxValues, SplitOptions, splitMessageOptions, toHumanReadable, type DMessageChannel, type DUser } from "@rsc-utils/discord-utils";
import { Snowflake } from "@rsc-utils/snowflake-utils";
import { chunk } from "@rsc-utils/string-utils";
import type { Message, MessageAttachment, MessageEmbed, Webhook } from "discord.js";
import type { SageCache } from "../sage/model/SageCache.js";
import { DialogType } from "../sage/repo/base/IdRepository.js";
import { createMessageEmbed } from "./createMessageEmbed.js";

type TSendToArgs = {
	content?: string;
	embedContent?: string;
	embedContentColor?: string;
	embeds?: MessageEmbed[];
	errMsg?: string;
	files?: MessageAttachment[];
	sageCache: SageCache;
	target: DMessageChannel | DUser | Webhook;
	threadId?: Snowflake;
};

function createEmbeds(embedContent?: string, embedContentColor?: string): MessageEmbed[] {
	if (embedContent?.trim()) {
		const chunks = chunk(embedContent, DiscordMaxValues.embed.descriptionLength);
		return chunks.map(chunk => createMessageEmbed({ description:chunk, color:embedContentColor }));
	}
	return [];
}

/**
 * Returns Message[] upon success, null upon error, and undefined if Sage doesn't have permissions to send to this channel/thread.
 */
 export async function sendTo(sendArgs: TSendToArgs, splitOptions: SplitOptions): Promise<Message[] | null | undefined> {
	const { sageCache, target, content, embedContent, embedContentColor, files, errMsg, threadId } = sendArgs;

	// if we can check permissions then let's do so first
	const canTest = target && ("permissionsFor" in target);
	const canSend = canTest ? await sageCache.canSendMessageToChannel(target) : true;
	if (canTest && !canSend) {
		/** @todo do i warn() here or am i doing it elsewhere? */
		return Promise.resolve(undefined);
	}

	// convert embedContent to embeds
	const embeds = createEmbeds(embedContent, embedContentColor).concat(sendArgs.embeds ?? []);

	// check for a user post type override
	const blankContentValue = splitOptions.blankContentValue;
	const contentToEmbeds = splitOptions.contentToEmbeds === true || sageCache.user.defaultSagePostType === DialogType.Embed;
	const embedsToContent = splitOptions.embedsToContent === true || sageCache.user.defaultSagePostType === DialogType.Post;

	// create post length safe payloads
	const payloads = splitMessageOptions({ content, embeds, files, threadId }, { blankContentValue, contentToEmbeds, embedsToContent });

	// create a rejection catcher
	const catcher = (err: unknown) => {
		let msg = `Trying to send message to ${toHumanReadable(target)}`;
		if (errMsg) {
			msg += ": " + errMsg;
		}
		error(msg, err);
		return null;
	};

	const messages: Message[] = [];
	for (const payload of payloads) {
		const message = await target.send(payload).catch(catcher);
		if (message) {
			if (typeof(message.type) === "string") {
				messages.push(message);
			}else {
				warn(`sendTo(): I should not hit this line of code.`);
			}
		}else {
			// we logged the error in catcher
			return null;
		}
	}
	return messages;
}
