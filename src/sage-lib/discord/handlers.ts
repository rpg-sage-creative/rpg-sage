import * as Discord from "discord.js";
import { isDefined, isNullOrUndefined, Optional } from "../../sage-utils";
import SageInteraction from "../sage/model/SageInteraction";
import SageMessage from "../sage/model/SageMessage";
import SageReaction from "../sage/model/SageReaction";
import { MessageType, ReactionType } from "./enums";
import { authorToMention } from "./messages";
import type { DMessage, DReaction, DUser, TChannel, TCommandAndArgsAndData, TCommandAndData, THandlerOutput, TInteractionHandler, TInteractionTester, TMessageHandler, TMessageTester, TReactionHandler, TReactionTester } from "./types";

//#region helpers

/**
 * We only call a handler if the tester returns a value other than: undefined, null, false
 * @param object
 */
function isActionableObject(object: any): boolean {
	return isDefined(object) && object !== false;
}

/**
 * If the listener's type isn't Both, confirm that it matches the current MessageType or ReactionType
 * @param listener
 * @param type
 */
function isActionableType(listener: TMessageListener, type: MessageType): boolean;
function isActionableType(listener: TReactionListener, type: ReactionType): boolean;
function isActionableType(listener: TMessageListener | TReactionListener, type: MessageType | ReactionType): boolean {
	return !listener.type || listener.type === type;
}

export async function isAuthorBotOrWebhook(sageMessage: SageMessage): Promise<boolean>;
export async function isAuthorBotOrWebhook(sageReaction: SageReaction): Promise<boolean>;
export async function isAuthorBotOrWebhook(messageOrReaction: SageMessage | SageReaction): Promise<boolean> {
	const message = ((<SageReaction>messageOrReaction).messageReaction ?? (<SageMessage>messageOrReaction)).message;
	const messageAuthorDid = message.author?.id;
	if (isActiveBot(messageAuthorDid)) {
		return true;
	}
	//TODO: This next line throws an exception if we don't have webhook access. TEST FOR IT FIRST!
	const webhook = await messageOrReaction.caches.discord.fetchWebhook(message.guild!, message.channel as TChannel, botMeta.dialogWebhookName!);
	return webhook?.id === messageAuthorDid;
}

//#endregion

type TBotMeta = { activeBotId?: Discord.Snowflake; testBotId?: Discord.Snowflake; dialogWebhookName?: string; };
const botMeta: TBotMeta = {};
export function setBotMeta(meta: TBotMeta): void {
	botMeta.activeBotId = meta.activeBotId;
	botMeta.dialogWebhookName = meta.dialogWebhookName;
	botMeta.testBotId = meta.testBotId;
}
// export function getActiveBotId(): Discord.Snowflake {
// 	return botMeta.activeBotId!;
// }
function isActiveBot(did?: Discord.Snowflake): boolean {
	return did === botMeta.activeBotId;
}
function isTesterBot(did: Discord.Snowflake): boolean {
	return did === botMeta.testBotId;
}

//#region listeners

type TListener = {
	command?: string;
	intents: Discord.IntentsString[];
	permissions: Discord.PermissionString[];
	priorityIndex?: number;
};

type TInteractionType = undefined;
type TInteractionListener = TListener & {
	tester: TInteractionTester;
	handler: TInteractionHandler;
	type?: TInteractionType;
};
const interactionListeners: TInteractionListener[] = [];

type TMessageListener = TListener & {
	tester: TMessageTester;
	handler: TMessageHandler;
	type: MessageType;
};
const messageListeners: TMessageListener[] = [];

type TReactionListener = TListener & {
	tester: TReactionTester;
	handler: TReactionHandler;
	type: ReactionType;
};
const reactionListeners: TReactionListener[] = [];

type TListenerType = TInteractionListener | TMessageListener | TReactionListener;
function getListeners<T extends TListenerType>(which: TListenerTypeName): T[] {
	switch(which) {
		case "InteractionListener": return interactionListeners as T[];
		case "MessageListener": return messageListeners as T[];
		case "ReactionListener": return reactionListeners as T[];
		default: return [];
	}
}

type TListenerTypeName = "InteractionListener" | "MessageListener" | "ReactionListener";
function registerListener<T extends TListenerType>(which: TListenerTypeName, listener: T): void {
	if (!botMeta.activeBotId) {
		console.error(`Please call setBotMeta({ activeBodId:"", testBotId?:"", dialogWebhookName:"" })`);
	}
	const listeners: T[] = getListeners(which);
	if (isNullOrUndefined(listener.priorityIndex)) {
		console.info(`Registering ${which} #${listeners.length + 1}: ${listener.command ?? listener.tester.name}`);
		listeners.push(listener);
	} else {
		console.info(`Registering ${which} #${listeners.length + 1} at priorityIndex ${listener.priorityIndex}: ${listener.command ?? listener.tester.name}`);
		if (listeners.find(l => l.priorityIndex === listener.priorityIndex)) {
			console.warn(`${which} at priorityIndex ${listener.priorityIndex} already exists!`);
		}
		listeners.splice(listener.priorityIndex, 0, listener);
	}
}

export function registerInteractionListener(tester: TInteractionTester, handler: TInteractionHandler, type?: TInteractionType, intents: Discord.IntentsString[] = [], permissions: Discord.PermissionString[] = [], priorityIndex?: number): void {
	registerListener("InteractionListener", { tester, handler, type, intents, permissions, priorityIndex });
}

export function registerMessageListener(tester: TMessageTester, handler: TMessageHandler, type = MessageType.Post, intents: Discord.IntentsString[] = [], permissions: Discord.PermissionString[] = [], priorityIndex?: number): void {
	registerListener("MessageListener", { tester, handler, type, intents, permissions, priorityIndex });
}

export function registerReactionListener<T>(tester: TReactionTester<T>, handler: TReactionHandler<T>, type = ReactionType.Both, intents: Discord.IntentsString[] = [], permissions: Discord.PermissionString[] = [], priorityIndex?: number): void {
	registerListener("ReactionListener", { tester, handler, type, intents, permissions, priorityIndex });
}

export function registeredIntents(): Discord.Intents {
	const registered: Discord.IntentsString[] = [];
	messageListeners.forEach(listener => registered.push(...listener.intents));
	reactionListeners.forEach(listener => registered.push(...listener.intents));

	const intents = new Discord.Intents();
	intents.add(
		// registered.filter(utils.ArrayUtils.Filters.unique)
		[
		"DIRECT_MESSAGES",
		"DIRECT_MESSAGE_REACTIONS",
		"GUILDS",
		"GUILD_BANS",
		"GUILD_EMOJIS_AND_STICKERS",
		"GUILD_MEMBERS",
		"GUILD_MESSAGES",
		"GUILD_MESSAGE_REACTIONS",
		"GUILD_PRESENCES",
		"GUILD_WEBHOOKS"
	]);
	return intents;
}

//#endregion

//#region interactions

export async function handleInteraction(interaction: Discord.Interaction): Promise<THandlerOutput> {
	const output = { tested: 0, handled: 0 };
	try {
		const isCommand = interaction.isCommand();
		if (isCommand) {
			const sageInteraction: SageInteraction = await SageInteraction.fromInteraction(interaction);
			await handleInteractions(sageInteraction, output);
		}
	}catch(ex) {
		console.error(authorToMention(interaction.user) ?? "Unknown User", interaction.toJSON(), ex);
	}
	return output;
}

async function handleInteractions(sageInteraction: SageInteraction, output: THandlerOutput): Promise<void> {
	for (const listener of interactionListeners) {
		// check if isActionableType here?
		const clonedInteraction = sageInteraction.clone();
		const data = await listener.tester(clonedInteraction);
		output.tested++;
		if (isActionableObject(data)) {
			await listener.handler(clonedInteraction, data);
			output.handled++;
			break;
		}
	}

}

//#endregion

// #region messages

/**
 * Discord edits posts with urls to add image and summary information as embeds.
 * We are already responding to the original, so we should ignore the edits.
 * 1. ignore image embeds
 * @param botTesterMessage
 */
function isEditWeCanIgnore(message: DMessage, originalMessage: Optional<DMessage>): boolean {
	if (!originalMessage) {
		return false;
	}

	// Embedding images and website cards don't change the message content
	const matchingContent = originalMessage.content === message.content;
	// The new message should have more embeds than the original
	const moreEmbedLengths = originalMessage.embeds.length < message.embeds.length;
	// If an embed's url is in the content, the edit was simply to create the embed
	const url = message.embeds[0]?.url;
	const contentIncludesUrl = url ? message.content?.includes(url) ?? false : false;
	//TODO: should i iterate through the embeds? ? ?

	return matchingContent && moreEmbedLengths && contentIncludesUrl;
}

export async function handleMessage(message: DMessage, originalMessage: Optional<DMessage>, messageType: MessageType): Promise<THandlerOutput> {
	const output = { tested: 0, handled: 0 };
	try {
		const isBot = message.author?.bot && !isTesterBot(message.author.id);
		const isWebhook = !!message.webhookId;
		const canIgnore = isEditWeCanIgnore(message, originalMessage);
		if (!isBot && !isWebhook && !canIgnore) {
			const sageMessage: SageMessage = await SageMessage.fromMessage(message, originalMessage);
			await handleMessages(sageMessage, messageType, output);
		}
	} catch (ex) {
		console.error(authorToMention(message.author) ?? "Unknown User", `\`${message.content}\``, ex);
	}
	return output;
}

async function handleMessages(sageMessage: SageMessage, messageType: MessageType, output: THandlerOutput): Promise<void> {
	for (const listener of messageListeners) {
		if (isActionableType(listener, messageType)) {
			const clonedMessage = sageMessage.clone();
			const commandAndArgsAndData = <TCommandAndArgsAndData<any>>await listener.tester(clonedMessage);
			output.tested++;
			if (isActionableObject(commandAndArgsAndData)) {
				clonedMessage.setCommandAndArgs(commandAndArgsAndData);
				await listener.handler(clonedMessage, commandAndArgsAndData.data);
				output.handled++;
				break;
			}
		}
	}
}

// #endregion messages

// #region reactions

/** Returns the number of handlers executed. */
export async function handleReaction(messageReaction: DReaction, user: DUser, reactionType: ReactionType): Promise<THandlerOutput> {
	const output = { tested: 0, handled: 0 };
	try {
		const isBot = user.bot && !isTesterBot(user.id);
		if (!isBot) {
			const sageReaction = await SageReaction.fromMessageReaction(messageReaction, user, reactionType);
			await handleReactions(sageReaction, reactionType, output);
		}
	} catch (ex) {
		console.error(authorToMention(user), `\`${messageReaction.emoji.name}\``, ex);
	}
	return output;
}
async function handleReactions(sageReaction: SageReaction, reactionType: ReactionType, output: THandlerOutput): Promise<void> {
	for (const listener of reactionListeners) {
		if (isActionableType(listener, reactionType)) {
			const clonedReaction = sageReaction.clone();
			const commandAndData = <TCommandAndData<any>>await listener.tester(clonedReaction);
			output.tested++;
			if (isActionableObject(commandAndData)) {
				clonedReaction.command = commandAndData.command;
				await listener.handler(clonedReaction, commandAndData.data);
				output.handled++;
				break;
			}
		}
	}
}

// #endregion Reaction Handling
