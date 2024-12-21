import { error, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, splitMessageOptions, type EmbedResolvable, type MessageTarget, type SplitOptions } from "@rsc-utils/discord-utils";
import { ActionRow, Attachment, AttachmentBuilder, Message, Webhook, type MessageActionRowComponent } from "discord.js";
import type { SageCache } from "../sage/model/SageCache.js";
import { DialogType } from "../sage/repo/base/IdRepository.js";

export type AttachmentResolvable = Attachment | AttachmentBuilder;

type SendToArgs = {
	avatarURL?: string;
	components?: ActionRow<MessageActionRowComponent>[];
	content?: string;
	embedContent?: string;
	embeds?: EmbedResolvable[];
	files?: AttachmentResolvable[];
	replyingTo?: string;
	sageCache: SageCache;
	target: MessageTarget | Webhook;
	threadId?: Snowflake;
	username?: string;
};

type Result = Message | DiscordApiError | undefined;
type Results = Result[] | undefined;

/**
 * If Sage doesn't have permissions to send to this channel/thread, then undefined is returned.
 * If catchHandler isn't given, then an array of Message, DiscordApiError, or undefined is returned.
 * If catchHandler is given, then an array of Message is returned and catchHandler is called for each error.
 * If multiple sends are attempted and an error occurs, all subsequent send attempts are skipped.
 */
export async function sendTo(sendArgs: SendToArgs, splitOptions: SplitOptions): Promise<(Message | DiscordApiError | undefined)[] | undefined>;
export async function sendTo(sendArgs: SendToArgs, splitOptions: SplitOptions, catchHandler: (err: unknown) => void): Promise<Message[] | undefined>;
export async function sendTo(sendArgs: SendToArgs, splitOptions: SplitOptions, catchHandler?: (err: unknown) => void): Promise<Results> {
	const { avatarURL, components, content, embedContent, embeds, files, replyingTo, sageCache, target, threadId, username } = sendArgs;

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

	const catcher = catchHandler
		? (reason: unknown) => { DiscordApiError.process(reason) ? void 0 : catchHandler(reason); return undefined; } // NOSONAR
		: (reason: unknown) => { const apiErr = DiscordApiError.from(reason); if (!apiErr) error(reason); return apiErr; }; // NOSONAR

	const results: Result[] = [];
	for (const payload of payloads) {
		const message = await target.send(payload).catch(catcher);
		if (message || !catchHandler) {
			results.push(message);
		}else {
			// let's stop sending if we have an error (which is most likely a username issue)
			break;
		}
	}
	return results;
}
