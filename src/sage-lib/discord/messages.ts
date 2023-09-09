import type * as Discord from "discord.js";
import utils, { Optional, OrNull } from "../../sage-utils";
import { toHumanReadable } from "../../sage-utils/utils/DiscordUtils/humanReadable";
import type SageCache from "../sage/model/SageCache";
import { DialogType } from "../sage/repo/base/IdRepository";
import DiscordKey from "./DiscordKey";
import { deleteMessage, deleteMessages } from "./deletedMessages";
import { createMessageEmbed, embedsToTexts, resolveToEmbeds, resolveToTexts } from "./embeds";
import type { DMessage, DUser, IMenuRenderable, TChannel, TRenderableContentResolvable } from "./types";

//#region helpers

export function authorToProfileUrl(author: DUser): string;
export function authorToProfileUrl(author: Optional<DUser>): OrNull<string>;
export function authorToProfileUrl(author: Optional<DUser>): OrNull<string> {
	return author ? `https://discordapp.com/users/${author.id}` : null;
}

export function guildToInviteUrl(guild: Optional<Discord.Guild>): OrNull<string> {
	if (!guild) {
		return null;
	}
	try {
		const bestInvite = guild.invites.cache.find(invite => !invite.stageInstance && !invite.targetUser && !invite.temporary && !!invite.channel.isText);
		return bestInvite?.url ?? null;
	}catch(ex) {
		console.error(ex);
	}
	return null;
}

function targetToName(target: DUser | TChannel): string {
	return "createDM" in target ? toHumanReadable(target) : channelToName(target);
}
export function channelToName(channel: Discord.GuildTextBasedChannel |  Discord.TextBasedChannel): string {
	if ("guild" in channel) {
		return `${channel.guild?.name ?? "MissingGuild"}#${channel.name ?? channel.id}`;
	}
	return `${"DMChannel"}#${channel.id}`;
}
function messageToChannelName(message: DMessage): string {
	const author = toHumanReadable(message.author) ?? "@NoAuthor";
	if (message.guild) {
		return `${channelToName(message.channel)}${author}`;
	}else {
		return `dm${author}`;
	}
}

function messageToDetails(message: DMessage): string {
	const channelName = messageToChannelName(message),
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

async function sendWebhookAndReturnMessages(webhook: Discord.Webhook, options: Discord.WebhookMessageOptions): Promise<Discord.Message[]> {
	const messages: Discord.Message[] = [];
	const response = await webhook.send(options).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	if (response) {
		if (typeof(response.type) === "string") {
			messages.push(response as Discord.Message);
		}else {
			console.warn(`sendWebhookAndReturnMessage(): I should not hit this line of code.`);
		}
	}
	return messages;
}

export async function sendWebhook(caches: SageCache, targetChannel: TChannel, renderableContent: TRenderableContentResolvable, authorOptions: Discord.WebhookMessageOptions, dialogType: DialogType): Promise<Discord.Message[]> {
	if (targetChannel.type === "DM") {
		const user = await caches.discord.fetchUser(caches.userDid);
		if (user) {
			return send(caches, targetChannel, renderableContent, user);
		}
		return [];
	}
	const webhook = await caches.discord.fetchOrCreateWebhook(targetChannel.guild, targetChannel, SageDialogWebhookName);
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${targetChannel.guild?.id}-${targetChannel.id}-${SageDialogWebhookName}`);
	}
	const threadId = targetChannel.isThread() ? targetChannel.id : undefined;
	const content = dialogType === DialogType.Post ? resolveToTexts(caches.cloneForChannel(targetChannel), renderableContent).join("\n") : undefined;
	const embeds = dialogType === DialogType.Embed ? resolveToEmbeds(caches.cloneForChannel(targetChannel), renderableContent) : [];
	const messages = await sendWebhookAndReturnMessages(webhook, { content, embeds, threadId, ...authorOptions });
	// caches.meta.push({ messagesSent:messages.slice() });
	return messages;
}

export async function replaceWebhook(caches: SageCache, originalMessage: DMessage, renderableContent: TRenderableContentResolvable, authorOptions: Discord.WebhookMessageOptions, dialogType: DialogType): Promise<Discord.Message[]> {
	if (!originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}
	if (!originalMessage.guild) {
		return Promise.reject(`Cannot Find Webhook w/o a Guild: ${originalMessage.channel?.id}`);
	}
	const webhook = await caches.discord.fetchOrCreateWebhook(originalMessage.guild, originalMessage.channel as TChannel, SageDialogWebhookName);
	if (!webhook) {
		return Promise.reject(`Cannot Find Webhook: ${originalMessage.guild?.id}-${originalMessage.channel?.id}-${SageDialogWebhookName}`);
	}
	await caches.pauseForTupper(DiscordKey.fromMessage(originalMessage));
	await deleteMessage(originalMessage);
	const threadId = originalMessage.channel.isThread() ? originalMessage.channel.id : undefined;
	const content = dialogType === DialogType.Post ? resolveToTexts(caches.cloneForChannel(originalMessage.channel as TChannel), renderableContent).join("\n") : undefined;
	const embeds = dialogType === DialogType.Embed ? resolveToEmbeds(caches.cloneForChannel(originalMessage.channel as TChannel), renderableContent) : [];
	const messages = await sendWebhookAndReturnMessages(webhook, { content, embeds, threadId, ...authorOptions });
	// caches.meta.push({ messagesDeleted:[deleted], messagesSent:messages.slice() });
	return messages;
}

//#endregion

export async function replace(caches: SageCache, originalMessage: DMessage, renderableContent: TRenderableContentResolvable): Promise<Discord.Message[]> {
	if (!originalMessage.deletable) {
		return Promise.reject(`Cannot Delete Message: ${messageToDetails(originalMessage)}`);
	}
	await deleteMessage(originalMessage);
	return send(caches, originalMessage.channel as TChannel, renderableContent, originalMessage.author);
}

export async function send(caches: SageCache, targetChannel: TChannel, renderableContent: TRenderableContentResolvable, originalAuthor: Discord.User | null): Promise<Discord.Message[]> {
	try {
		const menuRenderable = (<IMenuRenderable>renderableContent).toMenuRenderableContent && <IMenuRenderable>renderableContent || null,
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

async function sendRenderableContent(sageCache: SageCache, renderableContent: TRenderableContentResolvable, targetChannel: TChannel, originalAuthor: Discord.User | null): Promise<Discord.Message[]> {
	const messages: Discord.Message[] = [],
		embeds = resolveToEmbeds(sageCache.cloneForChannel(targetChannel), renderableContent);
	if (embeds.length > 2) {
		if (targetChannel.type !== "DM") {
			const embed = createMessageEmbed(undefined, "*Long reply sent via direct message!*");
			await sendTo({ sageCache, target:targetChannel, embeds:[embed], errMsg:"Notifying of DM" });
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

type TSendToArgs = {
	sageCache: SageCache;
	target: TChannel | DUser;
	content?: string;
	embeds?: Discord.MessageEmbed[];
	errMsg?: string;
};
/**
 * @todo PLEASE MOVE THIS TO A SHARED LOCATION
 * Returns a Discord.Message upon success, null upon error, and undefined if Sage doesn't have permissions to send to this channel/thread.
 */
 export async function sendTo({ sageCache, target, content, embeds, errMsg }: TSendToArgs): Promise<Discord.Message | null | undefined> {
	const canTest = target && ("permissionsFor" in target);
	const canSend = canTest ? await sageCache.canSendMessageTo(DiscordKey.fromChannel(target)) : true;
	if (canTest && !canSend) {
		return Promise.resolve(undefined);
	}
	if (sageCache.user.defaultSagePostType === DialogType.Post && embeds?.length) {
		content = (content ? `${content}\n------------------\n` : "") + embedsToTexts(embeds).join("\n");
		embeds = [];
	}
	return target.send({ content, embeds }).catch(error => {
		let msg = `Trying to send w/o permissions (${targetToName(target)})`;
		if (errMsg) {
			msg += `: ${errMsg}`;
		}
		console.error(msg, error);
		return null;
	});
}

async function sendMessageEmbeds({ sageCache, target, embeds }: { sageCache: SageCache; target: DUser | TChannel; embeds: Discord.MessageEmbed[] }): Promise<Discord.Message[]> {
	const messages: Discord.Message[] = [];
	for (const embed of embeds) {
		const message = await sendTo({ sageCache, target, embeds:[embed] });
		if (message) {
			messages.push(message);
		}
	}
	return messages;
}

function sendMenuRenderableContent(caches: SageCache, menuRenderable: IMenuRenderable, targetChannel: TChannel, originalAuthor: Discord.User | null): void {
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
function sendAndAwaitReactions(caches: SageCache, menuRenderable: IMenuRenderable, targetChannel: TChannel, originalAuthor: Discord.User | null): Promise<number> {
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
			reactions: Discord.MessageReaction[] = [];
		let reacting = true,
			deleted = false;
		lastMessage.awaitReactions(
			{
				max: 1,
				time: TIMEOUT_MILLI,
				errors: ['time'],
				filter:(reaction: Discord.MessageReaction, user: Discord.User) => {
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

function deleteMessagesOrClearReactions(sentMessages: Discord.Message[], reactions: Discord.MessageReaction[], reacting: boolean, deleted: boolean): void {
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
