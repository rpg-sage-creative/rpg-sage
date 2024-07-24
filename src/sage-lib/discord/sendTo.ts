import type { Snowflake } from "@rsc-utils/core-utils";
import { error, warn } from "@rsc-utils/core-utils";
import { splitMessageOptions, toHumanReadable, type EmbedResolvable, type MessageTarget, type SplitOptions } from "@rsc-utils/discord-utils";
import { ActionRow, Attachment, AttachmentBuilder, Message, Webhook, type MessageActionRowComponent } from "discord.js";
import type { SageCache } from "../sage/model/SageCache.js";
import { DialogType } from "../sage/repo/base/IdRepository.js";

export type AttachmentResolvable = Attachment | AttachmentBuilder;

type TSendToArgs = {
	avatarURL?: string;
	components?: ActionRow<MessageActionRowComponent>[];
	content?: string;
	embedContent?: string;
	embeds?: EmbedResolvable[];
	errMsg?: string;
	files?: AttachmentResolvable[];
	replyingTo?: string;
	sageCache: SageCache;
	target: MessageTarget | Webhook;
	threadId?: Snowflake;
	username?: string;
};

/**
 * Returns Message[] upon success, null upon error, and undefined if Sage doesn't have permissions to send to this channel/thread.
 */
 export async function sendTo(sendArgs: TSendToArgs, splitOptions: SplitOptions): Promise<Message[] | null | undefined> {
	const { avatarURL, components, content, embedContent, embeds, errMsg, files, replyingTo, sageCache, target, threadId, username } = sendArgs;

	// if we can check permissions then let's do so first
	const canTest = target && ("permissionsFor" in target);
	const canSend = canTest ? await sageCache.canSendMessageToChannel(target) : true;
	if (canTest && !canSend) {
		/** @todo do i warn() here or am i doing it elsewhere? */
		return Promise.resolve(undefined);
	}

	// check for a user post type override
	const contentToEmbeds = splitOptions.contentToEmbeds === true || sageCache.user.defaultSagePostType === DialogType.Embed;
	const embedsToContent = splitOptions.embedsToContent === true || sageCache.user.defaultSagePostType === DialogType.Post;

	// create post length safe payloads
	const payloads = splitMessageOptions({ avatarURL, components, content, embedContent, embeds, files, replyingTo, threadId, username }, { ...splitOptions, contentToEmbeds, embedsToContent });

	// create a rejection catcher
	const catcher = (err: unknown) => {
		let msg = `Trying to send message to ${toHumanReadable(target)}`;
		if (threadId) {
			msg += ` (${threadId})`;
		}
		if (errMsg) {
			msg += `: ${errMsg})`;
		}
		error(msg, err);
		return null;
	};

	const messages: Message[] = [];
	for (const payload of payloads) {
		const message = await target.send(payload).catch(catcher);
		if (message) {
			if (typeof(message.type) === "number") {
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
