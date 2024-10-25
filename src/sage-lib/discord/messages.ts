import { error, warn, warnReturnNull, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey, isDMBased, isGuildBased, toHumanReadable, toInviteUrl, toMessageUrl, toUserUrl, type MessageOrPartial, type MessageTarget } from "@rsc-utils/discord-utils";
import { RenderableContent, type RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { Channel, Message, MessageReaction, User } from "discord.js";
import type { SageCache } from "../sage/model/SageCache.js";
import { DialogType } from "../sage/repo/base/IdRepository.js";
import { createMessageEmbed } from "./createMessageEmbed.js";
import { deleteMessage, deleteMessages } from "./deletedMessages.js";
import { resolveToEmbeds } from "./resolvers/resolveToEmbeds.js";
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
};

/**
 * Currently, we don't send webhooks to DMs; if the targetChannel is a DM we send as Sage to the user.
 * If we cannot find a webhook, we return a Promise.reject.
 */
export async function sendWebhook(targetChannel: Channel, webhookOptions: WebhookOptions): Promise<Optional<Message[]>> {
	const { authorOptions, renderableContent, dialogType, files, sageCache } = webhookOptions;

	if (isDMBased(targetChannel)) {
		const user = await sageCache.discord.fetchUser(sageCache.userDid);
		if (user) {
			return send(sageCache, targetChannel as MessageTarget, renderableContent, user);
		}
		return [];
	}

	const webhook = await sageCache.discord.fetchOrCreateWebhook(targetChannel);
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${targetChannel.guild?.id}-${targetChannel.id}-dialog`);
	}

	const embeds = resolveToEmbeds(sageCache.cloneForChannel(targetChannel as MessageTarget), renderableContent);
	const contentToEmbeds = dialogType === DialogType.Embed;
	const embedsToContent = dialogType === DialogType.Post;
	// const content = dialogType === DialogType.Post ? resolveToTexts(sageCache.cloneForChannel(targetChannel), renderableContent).join("\n") : undefined;
	// const embeds = dialogType === DialogType.Embed ? resolveToEmbeds(sageCache.cloneForChannel(targetChannel), renderableContent) : [];
	// const messages = await sendWebhookAndReturnMessages(webhook, { content, embeds, files, threadId, ...authorOptions });

	const threadId = targetChannel.isThread() ? targetChannel.id as Snowflake : undefined;

	return sendTo({ sageCache, target:webhook, embeds, files, threadId, ...authorOptions }, { contentToEmbeds, embedsToContent });
}

export async function replaceWebhook(originalMessage: MessageOrPartial, webhookOptions: WebhookOptions): Promise<Message[]> {
	const { authorOptions, renderableContent, dialogType, files, sageCache, skipDelete } = webhookOptions;

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
	if (!skipDelete) {
		await deleteMessage(originalMessage);
	}

	let content = undefined;
	let replyingTo: string | undefined;
	if (originalMessage.reference?.messageId) {
		const referenceMessage = await sageCache.fetchMessage(originalMessage.reference);
		const displayName = referenceMessage ? `*${referenceMessage.author.displayName}*` : ``;
		replyingTo = `*replying to* ${displayName} ${toMessageUrl(originalMessage.reference)}`;
	}

	const embeds = resolveToEmbeds(sageCache.cloneForChannel(originalMessage.channel), renderableContent);
	if (embeds.length === 1 && !embeds[0].length && files?.length) {
		embeds.length = 0;
	}

	const contentToEmbeds = dialogType === DialogType.Embed;
	const embedsToContent = dialogType === DialogType.Post;

	const threadId = originalMessage.channel.isThread() ? originalMessage.channel.id as Snowflake : undefined;

	const messages = await sendTo({ sageCache, target:webhook, content, embeds, files, replyingTo, threadId, ...authorOptions }, { contentToEmbeds, embedsToContent });
	if (!messages) {
		warn(`replaceWebhook -> sendTo = ${messages}`);
		return [];
	}
	return messages;
}

//#endregion

export async function replace(caches: SageCache, originalMessage: Message, renderableContent: RenderableContentResolvable): Promise<Message[]> {
	if (!originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}
	await deleteMessage(originalMessage);
	return send(caches, originalMessage.channel, renderableContent, originalMessage.author);
}

export async function send(caches: SageCache, targetChannel: MessageTarget, renderableContent: RenderableContentResolvable, originalAuthor: Optional<User>): Promise<Message[]> {
	try {
		const menuRenderable = (<IMenuRenderable>renderableContent).toMenuRenderableContent && <IMenuRenderable>renderableContent || null,
			menuItemCount = menuRenderable?.getMenuLength() ?? 0;
		if (!menuItemCount) {
			const resolvedRenderableContent = RenderableContent.resolve(renderableContent);
			if (resolvedRenderableContent) {
				return sendRenderableContent(caches, resolvedRenderableContent, targetChannel, originalAuthor);
			}
		}else {
			sendMenuRenderableContent(caches, menuRenderable, targetChannel, originalAuthor);
			return [];
		}
	}catch(ex) {
		error(ex);
	}
	return [];
}

async function sendRenderableContent(sageCache: SageCache, renderableContent: RenderableContentResolvable, targetChannel: MessageTarget, originalAuthor: Optional<User>): Promise<Message[]> {
	const messages: Message[] = [];
	const embeds = resolveToEmbeds(sageCache.cloneForChannel(targetChannel), renderableContent);
	if (embeds.length > 2) {
		if (isGuildBased(targetChannel)) {
			const embed = createMessageEmbed({ description:"*Long reply sent via direct message!*" });
			const sent = await sendTo({ sageCache, target:targetChannel, embeds:[embed], errMsg:"Notifying of DM" }, { });
			messages.push(...sent ?? []);
		}
		if (originalAuthor) {
			const sent = await sendTo({ sageCache, target:originalAuthor, embeds }, { });
			messages.push(...sent ?? []);
		}
	}else {
		const sent = await sendTo({ sageCache, target:targetChannel, embeds }, { });
		messages.push(...sent ?? []);
	}
	return messages;
}

function sendMenuRenderableContent(caches: SageCache, menuRenderable: IMenuRenderable, targetChannel: MessageTarget, originalAuthor: Optional<User>): void {
	const menuLength = menuRenderable.getMenuLength();
	if (menuLength > 1) {
		sendAndAwaitReactions(caches, menuRenderable, targetChannel, originalAuthor).then(index => {
			send(caches, targetChannel, menuRenderable.toMenuRenderableContent(index), originalAuthor);
		}, reason => logIfNotTimeout("reason", reason));
	}else {
		const renderable = menuRenderable.toMenuRenderableContent();
		if (renderable) {
			send(caches, targetChannel, renderable, originalAuthor);
		}else {
			warn(`sendMenuRenderableContent: Nothing to send!`);
		}
	}
}

const TIMEOUT = "TIMEOUT";
const TIMEOUT_MILLI = 60 * 1000;
function sendAndAwaitReactions(caches: SageCache, menuRenderable: IMenuRenderable, targetChannel: MessageTarget, originalAuthor: Optional<User>): Promise<number> {
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

		const sentMessages = await sendRenderableContent(caches, menuRenderable.toMenuRenderableContent(), targetChannel, originalAuthor),
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
			if (!caches.discordKey.isDm) {
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
