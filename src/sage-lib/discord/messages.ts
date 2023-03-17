import { ChannelType, EmbedBuilder, Guild, Message, MessageReaction, User, Webhook, WebhookMessageCreateOptions, WebhookMessageEditOptions } from "discord.js";
import type { IMenuRenderable } from "../../sage-search/IMenuRenderable";
import utils, { Optional, OrNull } from "../../sage-utils";
import { DChannel, DMessage, DUser, toHumanReadable } from "../../sage-utils/utils/DiscordUtils";
import { createMessageEmbed, resolveToEmbeds, resolveToTexts } from "../../sage-utils/utils/DiscordUtils/embeds";
import { sendTo } from "../../sage-utils/utils/DiscordUtils/sendMessage";
import type { TRenderableContentResolvable } from "../../sage-utils/utils/RenderUtils/RenderableContent";
import type SageCache from "../sage/model/SageCache";
import { DialogType } from "../sage/repo/base/channel";

//#region helpers

function authorToProfileUrl(author: Optional<DUser>): OrNull<string> {
	return author ? `https://discordapp.com/users/${author.id}` : null;
}

export function guildToInviteUrl(_guild: Optional<Guild>): OrNull<string> {
	// if (!guild) {
	// 	return null;
	// }
	// try {
	// 	const bestInvite = guild.invites.cache.find(invite => !invite.stageInstance && !invite.targetUser && !invite.temporary && !!invite.channel.isText);
	// 	return bestInvite?.url ?? null;
	// }catch(ex) {
	// 	console.error(ex);
	// }
	return null;
}

function messageToDetails(message: DMessage): string {
	const channelName = toHumanReadable(message),
		profileUrl = authorToProfileUrl(message.author) ?? "Invalid ProfileUrl",
		inviteUrl = guildToInviteUrl(message.guild) ?? "Invalid InviteUrl";
	return `${channelName}\n<${profileUrl}>\n<${inviteUrl}>`;
}

function logIfNotTimeout(typeOfReason: string, reason: string): void {
	if (reason !== TIMEOUT) {
		console.error(`${typeOfReason}: ${reason}`);
	}
}

//#endregion

//#region webhook

export const SageDialogWebhookName = "SageDialogWebhookName";

async function sendWebhookAndReturnMessages(webhook: Webhook, options: WebhookMessageCreateOptions): Promise<Message[]> {
	const messages: Message[] = [];
	const response = await webhook.send(options).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (response) {
		if (typeof(response.type) === "string") {
			messages.push(response as Message);
		}else {
			console.warn(`sendWebhookAndReturnMessage(): I should not hit this line of code.`);
		}
	}
	return messages;
}

export async function sendWebhook(caches: SageCache, targetChannel: DChannel, renderableContent: TRenderableContentResolvable, authorOptions: WebhookMessageCreateOptions, dialogType: DialogType): Promise<Message[]> {
	if (targetChannel.isDMBased()) {
		const user = await caches.discord.fetchUser(caches.actor.did);
		if (user) {
			return send(caches, targetChannel, renderableContent, user);
		}
		return [];
	}
	const discord = await caches.discord.forWebhook(targetChannel);
	const webhook = await discord?.fetchOrCreateWebhook();
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${targetChannel.guild?.id}-${targetChannel.id}-${SageDialogWebhookName}`);
	}
	const formatter = caches.getFormatter(targetChannel);
	const content = dialogType === DialogType.Post ? resolveToTexts(renderableContent, formatter).join("\n") : undefined;
	const embeds = dialogType === DialogType.Embed ? resolveToEmbeds(renderableContent, formatter) : [];
	const threadId = targetChannel.isThread() ? targetChannel.id : undefined;
	const messages = await sendWebhookAndReturnMessages(webhook, { content, embeds, threadId, ...authorOptions });
	return messages;
}

export async function replaceWebhook(caches: SageCache, originalMessage: DMessage, renderableContent: TRenderableContentResolvable, authorOptions: WebhookMessageEditOptions, dialogType: DialogType): Promise<Message[]> {
	if (originalMessage.channel.isDMBased()) {
		const user = caches.actor.d;
		if (user) {
			return replace(caches, originalMessage, renderableContent);
		}
		return [];
	}
	if (!originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}
	if (!originalMessage.guild) {
		return Promise.reject(`Cannot Find Webhook w/o a Guild: ${originalMessage.channel?.id}`);
	}
	const discord = await caches.discord.forWebhook(originalMessage.channel);
	const webhook = await discord?.fetchOrCreateWebhook();
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${originalMessage.guild?.id}-${originalMessage.channel?.id}-${SageDialogWebhookName}`);
	}
	await originalMessage.delete();
	const formatter = caches.getFormatter(originalMessage.channel);
	const content = dialogType === DialogType.Post ? resolveToTexts(renderableContent, formatter).join("\n") : undefined;
	const embeds = dialogType === DialogType.Embed ? resolveToEmbeds(renderableContent, formatter) : [];
	const threadId = originalMessage.channel.isThread() ? originalMessage.channel.id : undefined;
	const messages = await sendWebhookAndReturnMessages(webhook, { ...authorOptions, content, embeds, threadId });
	return messages;
}

//#endregion

export async function replace(caches: SageCache, originalMessage: DMessage, renderableContent: TRenderableContentResolvable): Promise<Message[]> {
	if (!originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}
	await originalMessage.delete();
	return send(caches, originalMessage.channel as DChannel, renderableContent, originalMessage.author);
}

export async function send(caches: SageCache, targetChannel: DChannel, renderableContent: TRenderableContentResolvable, originalAuthor: User | null): Promise<Message[]> {
	try {
		const menuRenderable = (renderableContent as IMenuRenderable).toMenuRenderableContent && renderableContent as IMenuRenderable || null,
			menuItemCount = menuRenderable?.getMenuLength() ?? 0;
		if (!menuItemCount) {
			const resolvedRenderableContent = utils.RenderUtils.RenderableContent.resolve(renderableContent);
			if (resolvedRenderableContent) {
				return sendRenderableContent(caches, resolvedRenderableContent, targetChannel, originalAuthor);
			}
		}else {
			sendMenuRenderableContent(caches, menuRenderable, targetChannel, originalAuthor);
			return [];
		}
	}catch(ex) {
		console.error(ex);
	}
	return [];
}

async function sendRenderableContent(sageCache: SageCache, renderableContent: TRenderableContentResolvable, targetChannel: DChannel, originalAuthor: User | null): Promise<Message[]> {
	const messages: Message[] = [],
		embeds = resolveToEmbeds(renderableContent, sageCache.getFormatter(targetChannel));
	if (embeds.length > 2) {
		if (targetChannel.type !== ChannelType.DM) {
			const embed = createMessageEmbed(undefined, "*Long reply sent via direct message!*");
			await sendTo({
				botId: sageCache.bot.did,
				embeds: [embed],
				embedsAsContent: sageCache.sendEmbedsAsContent,
				errMsg: "Notifying of DM",
				target: targetChannel
			});
		}
		if (originalAuthor) {
			const sent = await sendMessageEmbeds({ sageCache, embeds, target:originalAuthor });
			messages.push(...sent);
		}
	}else {
		const sent = await sendMessageEmbeds({ sageCache, embeds, target:targetChannel });
		messages.push(...sent);
	}
	return messages;
}


async function sendMessageEmbeds({ sageCache, target, embeds }: { sageCache: SageCache; target: DUser | DChannel; embeds: EmbedBuilder[] }): Promise<Message[]> {
	const messages: Message[] = [];
	for (const embed of embeds) {
		const message = await sendTo({
			botId: sageCache.bot.did,
			embeds: [embed],
			embedsAsContent: sageCache.sendEmbedsAsContent,
			target
		});
		if (message) {
			messages.push(message);
		}
	}
	return messages;
}

function sendMenuRenderableContent(caches: SageCache, menuRenderable: IMenuRenderable, targetChannel: DChannel, originalAuthor: User | null): void {
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
			console.warn(`sendMenuRenderableContent: Nothing to send!`);
		}
	}
}

const TIMEOUT = "TIMEOUT";
const TIMEOUT_MILLI = 60 * 1000;
function sendAndAwaitReactions(caches: SageCache, menuRenderable: IMenuRenderable, targetChannel: DChannel, originalAuthor: User | null): Promise<number> {
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
				reject("No Discord.MessageReaction Collection!?");
			}else if (!collected.size) {
				reject("Empty Discord.MessageReaction Collection!?");
			}else {
				const emojiName = collected.first()?.emoji.name;
				resolve(emojiName ? unicodeArray.indexOf(emojiName) : -1);
			}

		}, (/*reason*/) => {
			if (!caches.discordKey.isDm) {
				lastMessage.reactions.removeAll().catch(ex => {
					console.warn(`Clearing Reactions`, ex);
					reactions.forEach(reaction => reaction.remove().catch(x => console.error(`Clearing Reaction`, x)));
				});
			}
			reject(TIMEOUT);
		});

		for (let index = 0; index < menuLength; index++) {
			let emoji: string;
			if (!deleted && (emoji = unicodeArray[index])) {
				const reaction = await lastMessage.react(emoji).catch(utils.ConsoleUtils.Catchers.warnReturnNull);
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
		Promise.all(sentMessages.map(message => message?.deletable && message.delete())).catch(() => {
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
