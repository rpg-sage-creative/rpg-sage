import { error, RenderableContent, warn, warnReturnNull, type Optional, type RenderableContentResolvable, type Snowflake } from "@rsc-utils/core-utils";
import { addInvalidWebhookUsername, DiscordKey, isMessage, isSupportedGameChannel, toHumanReadable, toInviteUrl, toMessageUrl, toUserMention, toUserUrl, type MessageOrPartial, type SMessage, type SMessageOrPartial, type SupportedMessagesChannel, type SupportedTarget } from "@rsc-utils/discord-utils";
import type { Message, MessageReaction, User } from "discord.js";
import type { SageCache } from "../sage/model/SageCache.js";
import { DialogType } from "../sage/repo/base/IdRepository.js";
import { SageMessageReference } from "../sage/repo/SageMessageReference.js";
import { createMessageEmbed } from "./createMessageEmbed.js";
import { deleteMessage, deleteMessages } from "./deletedMessages.js";
import { sendTo, type AttachmentResolvable } from "./sendTo.js";
import type { IMenuRenderable } from "./types.js";

//#region helpers

function messageToDetails(message: MessageOrPartial): string {
	const channelName = toHumanReadable(message),
		profileUrl = toUserUrl(message.author) ?? "Invalid ProfileUrl",
		inviteUrl = toInviteUrl(message.guild) ?? "Invalid InviteUrl";
	return `${channelName}\n<${profileUrl}>\n<${inviteUrl}>`;
}

function logIfNotTimeout(typeOfReason: string, reason: string): void {
	if (reason !== TIMEOUT) {
		error(`${typeOfReason}: ${reason}`);
	}
}

//#endregion

//#region webhook

export type AuthorOptions = {
	username?: string;
	avatarURL?: string;
}

type WebhookOptions = {
	authorOptions: AuthorOptions;
	dialogType: DialogType;
	files?: AttachmentResolvable[];
	renderableContent: RenderableContentResolvable;
	sageCache: SageCache;
	skipDelete?: boolean;
	skipReplyingTo?: boolean;
};

/**
 * Currently, we don't send webhooks to DMs; if the targetChannel is a DM we send as Sage to the user.
 * If we cannot find a webhook, we return a Promise.reject.
 */
export async function sendWebhook(targetChannel: SupportedMessagesChannel, webhookOptions: WebhookOptions): Promise<Message[] | undefined> {
	const { authorOptions, renderableContent, dialogType, files, sageCache } = webhookOptions;

	if (targetChannel.isDMBased()) {
		const actor = await sageCache.validateActor();
		if (actor.discord) {
			return send(sageCache, targetChannel, renderableContent, actor.discord);
		}
		return [];
	}

	const webhook = await sageCache.discord.fetchOrCreateWebhook(targetChannel);
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${targetChannel.guild?.id}-${targetChannel.id}-dialog`);
	}

	const embeds = sageCache.resolveToEmbeds(renderableContent);

	const contentToEmbeds = dialogType === DialogType.Embed;
	const embedsToContent = dialogType === DialogType.Post;
	// const content = dialogType === DialogType.Post ? resolveToTexts(sageCache.cloneForChannel(targetChannel), renderableContent).join("\n") : undefined;
	// const embeds = dialogType === DialogType.Embed ? resolveToEmbeds(sageCache.cloneForChannel(targetChannel), renderableContent) : [];
	// const messages = await sendWebhookAndReturnMessages(webhook, { content, embeds, files, threadId, ...authorOptions });

	const threadId = targetChannel.isThread() ? targetChannel.id as Snowflake : undefined;

	return sendTo(
		{ sageCache, target:webhook, embeds, files, threadId, ...authorOptions },
		{ contentToEmbeds, embedsToContent },
		(err: unknown) => error(`${toHumanReadable(targetChannel)}${threadId?" "+threadId:""}: sendWebhook`, err)
	);
}

export async function replaceWebhook(originalMessage: SMessageOrPartial, webhookOptions: WebhookOptions): Promise<Message[]> {
	const { authorOptions, renderableContent, dialogType, files, sageCache, skipDelete, skipReplyingTo } = webhookOptions;

	if (!skipDelete && !originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}

	if (!originalMessage.guild) {
		return Promise.reject(`Cannot Find Webhook w/o a Guild: ${originalMessage.channel?.id}`);
	}

	const webhook = await sageCache.discord.fetchOrCreateWebhook(originalMessage);
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${originalMessage.guild?.id}-${originalMessage.channel?.id}-dialog`);
	}

	// this pauses in case Tupper is also deleting the message so that our delete attempt can detect if it was deleted to avoid errors
	await sageCache.pauseForTupper(DiscordKey.from(originalMessage));

	let content = undefined;
	let replyingTo: string | undefined;
	if (originalMessage.reference && !skipReplyingTo) {
		const referenceMessage = await sageCache.fetchMessage(originalMessage.reference);
		const displayName = referenceMessage ? `*${referenceMessage.author.displayName}*` : ``;

		const dialogMessage = await SageMessageReference.read(originalMessage.reference, { ignoreMissingFile:true });
		const userMention = toUserMention(dialogMessage?.userId) ?? ``;

		replyingTo = `*replying to* ${displayName} ${userMention} ${toMessageUrl(originalMessage.reference)}`.replace(/\s+/g, " ");
	}

	const embeds = sageCache.resolveToEmbeds(renderableContent);
	if (embeds.length === 1 && !embeds[0].length && files?.length) {
		embeds.length = 0;
	}

	const contentToEmbeds = dialogType === DialogType.Embed;
	const embedsToContent = dialogType === DialogType.Post;

	const threadId = originalMessage.channel.isThread() ? originalMessage.channel.id as Snowflake : undefined;

	const results = await sendTo({ sageCache, target:webhook, content, embeds, files, replyingTo, threadId, ...authorOptions }, { contentToEmbeds, embedsToContent });
	if (!results) {
		warn(`${toHumanReadable(originalMessage.channel)}${threadId?" "+threadId:""}: replaceWebhook ==> canTest && !canSend (no perms)`);
		return [];
	}
	const messages: Message[] = [];
	for (const result of results) {
		if (isMessage(result)) {
			messages.push(result);

		}else if (result?.isUsername) {
			const invalidUsername = result.getInvalidUsername() ?? authorOptions.username ?? "unknown";
			const dUser = await sageCache.discord.fetchUser(sageCache.user.did);
			await dUser?.send(`We are unable to send your message for the following reason:\n${sageCache.getLocalizer()("USERNAME_S_BANNED", invalidUsername)}`);
			const updated = addInvalidWebhookUsername(authorOptions.username, invalidUsername);
			error({ fn:"replaceWebhook", invalidUsername, updated });

		}else if (result && !result.process()) {
			error(`${toHumanReadable(originalMessage.channel)}${threadId?" "+threadId:""}: replaceWebhook`, result.error);
		}
	}

	// delete the original if we didn't get any errors
	if (results.length === messages.length && !skipDelete) {
		await deleteMessage(originalMessage);
	}

	return messages;
}

//#endregion

export async function replace(sageCache: SageCache, originalMessage: SMessage, renderableContent: RenderableContentResolvable): Promise<Message[]> {
	if (!originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}
	await deleteMessage(originalMessage);
	return send(sageCache, originalMessage.channel, renderableContent, originalMessage.author);
}

export async function send(sageCache: SageCache, targetChannel: SupportedTarget, renderableContent: RenderableContentResolvable, originalAuthor: Optional<User>): Promise<SMessage[]> {
	try {
		const menuRenderable = (<IMenuRenderable>renderableContent).toMenuRenderableContent && <IMenuRenderable>renderableContent || null,
			menuItemCount = menuRenderable?.getMenuLength() ?? 0;
		if (!menuItemCount) {
			const resolvedRenderableContent = RenderableContent.resolve(renderableContent);
			if (resolvedRenderableContent) {
				return sendRenderableContent(sageCache, resolvedRenderableContent, targetChannel, originalAuthor);
			}
		}else {
			sendMenuRenderableContent(sageCache, menuRenderable, targetChannel, originalAuthor);
			return [];
		}
	}catch(ex) {
		error(ex);
	}
	return [];
}

async function sendRenderableContent(sageCache: SageCache, renderableContent: RenderableContentResolvable, targetChannel: SupportedTarget, originalAuthor: Optional<User>): Promise<SMessage[]> {
	const messages: Message[] = [];
	const embeds = sageCache.cloneForChannel(targetChannel).resolveToEmbeds(renderableContent);
	if (embeds.length > 2) {
		if (isSupportedGameChannel(targetChannel)) {
			const embed = createMessageEmbed({ description:"*Long reply sent via direct message!*" });
			const sent = await sendTo({ sageCache, target:targetChannel, embeds:[embed] }, { }, (err: unknown) => error(`${toHumanReadable(targetChannel)}: Notifying of sendRenderableContent DM`, err));
			messages.push(...sent ?? []);
		}
		if (originalAuthor) {
			const sent = await sendTo({ sageCache, target:originalAuthor, embeds }, { }, (err: unknown) => error(`${toHumanReadable(originalAuthor)}: Sending sendRenderableContent as DM`, err));
			messages.push(...sent ?? []);
		}
	}else {
		const sent = await sendTo({ sageCache, target:targetChannel, embeds }, { }, (err: unknown) => error(`${toHumanReadable(originalAuthor)}: Sending sendRenderableContent`, err));
		messages.push(...sent ?? []);
	}
	return messages as SMessage[];
}

function sendMenuRenderableContent(sageCache: SageCache, menuRenderable: IMenuRenderable, targetChannel: SupportedTarget, originalAuthor: Optional<User>): void {
	const menuLength = menuRenderable.getMenuLength();
	if (menuLength > 1) {
		sendAndAwaitReactions(sageCache, menuRenderable, targetChannel, originalAuthor).then(index => {
			send(sageCache, targetChannel, menuRenderable.toMenuRenderableContent(index), originalAuthor);
		}, reason => logIfNotTimeout("reason", reason));
	}else {
		const renderable = menuRenderable.toMenuRenderableContent();
		if (renderable) {
			send(sageCache, targetChannel, renderable, originalAuthor);
		}else {
			warn(`sendMenuRenderableContent: Nothing to send!`);
		}
	}
}

const TIMEOUT = "TIMEOUT";
const TIMEOUT_MILLI = 60 * 1000;
function sendAndAwaitReactions(sageCache: SageCache, menuRenderable: IMenuRenderable, targetChannel: SupportedTarget, originalAuthor: Optional<User>): Promise<number> {
	return new Promise<number>(async (resolve, reject) => {
		const menuLength = menuRenderable.getMenuLength();
		if (menuLength < 1) {
			reject(`menuLength === ${menuLength}`);
			return;

		}
		if (menuLength === 1) {
			resolve(0);
			return;
		}

		const sentMessages = await sendRenderableContent(sageCache, menuRenderable.toMenuRenderableContent(), targetChannel, originalAuthor),
			lastMessage = sentMessages[sentMessages.length - 1];
		if (!lastMessage) {
			reject(`No message sent!`);
			return;
		}

		const unicodeArray = menuRenderable.getMenuUnicodeArray(),
			reactions: MessageReaction[] = [];
		let reacting = true,
			deleted = false;
		lastMessage.awaitReactions(
			{
				max: 1,
				time: TIMEOUT_MILLI,
				errors: ['time'],
				filter:(reaction: MessageReaction, user: User) => {
					const emojiName = reaction.emoji.name;
					return user.id === originalAuthor?.id && emojiName !== null && unicodeArray.includes(emojiName);
				}
			}
		).then(collected => {
			deleted = true;
			deleteMessagesOrClearReactions(sentMessages, reactions, reacting, deleted);

			if (!collected) {
				reject("No MessageReaction Collection!?");
			}else if (!collected.size) {
				reject("Empty MessageReaction Collection!?");
			}else {
				const emojiName = collected.first()?.emoji.name;
				resolve(emojiName ? unicodeArray.indexOf(emojiName) : -1);
			}

		}, (/*reason*/) => {
			if (!sageCache.discordKey.isDm) {
				lastMessage.reactions.removeAll().catch(ex => {
					warn(`Clearing Reactions`, ex);
					reactions.forEach(reaction => reaction.remove().catch(x => error(`Clearing Reaction`, x)));
				});
			}
			reject(TIMEOUT);
		});

		for (let index = 0; index < menuLength; index++) {
			let emoji: string;
			if (!deleted && (emoji = unicodeArray[index])) {
				const reaction = await lastMessage.react(emoji).catch(warnReturnNull);
				if (reaction) {
					reactions.push(reaction);
				}
			}
		}

		reacting = false;
		deleteMessagesOrClearReactions(sentMessages, reactions, reacting, deleted);

	});
}

function deleteMessagesOrClearReactions(sentMessages: Message[], reactions: MessageReaction[], reacting: boolean, deleted: boolean): void {
	if (!reacting && deleted) {
		deleteMessages(sentMessages).catch(() => {
			const popped = sentMessages.pop();
			if (popped && popped.deletable) {
				popped.reactions.removeAll().catch(() => {
					reactions.forEach(reaction => reaction && reaction.remove());
				});
			}
		});
	}
}

// #endregion
