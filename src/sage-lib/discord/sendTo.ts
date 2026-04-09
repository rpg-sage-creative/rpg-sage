import type { Snowflake } from "@rsc-utils/core-utils";
import { DiscordApiError, sendTo as sendToDiscord, type EmbedResolvable, type SplitOptions, type SupportedTarget } from "@rsc-utils/discord-utils";
import { ActionRow, Attachment, AttachmentBuilder, Message, Webhook, type MessageActionRowComponent } from "discord.js";
import type { SageCache } from "../sage/model/SageCache.js";
// import { sendTo as sendToStoat } from "@rsc-utils/stoat-utils";

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
	target: SupportedTarget | Webhook;
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
	/** @todo include some indication of the chat client to know where to send the message: discord v stoat v fluxer */
	return sendToDiscord(sendArgs, splitOptions, catchHandler as (err: unknown) => void);
}
