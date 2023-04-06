import { GatewayIntentBits, IntentsBitField, Interaction, PermissionsString, Snowflake } from "discord.js";
import { isDefined, isNullOrUndefined, Optional } from "../../sage-utils";
import { DMessage, DReaction, DUser, MessageType, ReactionType, toHumanReadable } from "../../sage-utils/DiscordUtils";
import { DiscordFetches } from "../../sage-utils/DiscordUtils";
import type { TAcceptableBot } from "../sage/model/Bot";
import { SageInteraction } from "../sage/model/SageInteraction";
import { SageMessage } from "../sage/model/SageMessage";
import { SageReaction } from "../sage/model/SageReaction";
import type { TCommandAndArgsAndData, TCommandAndData, THandlerOutput, TInteractionHandler, TInteractionTester, TMessageHandler, TMessageTester, TReactionHandler, TReactionTester } from "./types";

//#region helpers

/**
 * We only call a handler if the tester returns a value other than: undefined, null, false
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

//#endregion

const acceptableBots: TAcceptableBot[] = [];
function isAcceptableBot(did: Optional<Snowflake>): boolean {
	return acceptableBots.find(bot => bot.did === did) !== undefined;
}
export function addAcceptableBot(...bots: TAcceptableBot[]): void {
	acceptableBots.push(...bots);
}

//#region listeners

type TListener = {
	command?: string;
	intents: GatewayIntentBits[];
	permissions: PermissionsString[];
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
	if (!DiscordFetches.botId) {
		console.error(`Please call setBotMeta(botMeta)`);
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

export function registerInteractionListener(tester: TInteractionTester, handler: TInteractionHandler, type?: TInteractionType, intents: GatewayIntentBits[] = [], permissions: PermissionsString[] = [], priorityIndex?: number): void {
	registerListener("InteractionListener", { tester, handler, type, intents, permissions, priorityIndex });
}

export function registerMessageListener(tester: TMessageTester, handler: TMessageHandler, type = MessageType.Post, intents: GatewayIntentBits[] = [], permissions: PermissionsString[] = [], priorityIndex?: number): void {
	registerListener("MessageListener", { tester, handler, type, intents, permissions, priorityIndex });
}

export function registerReactionListener<T>(tester: TReactionTester<T>, handler: TReactionHandler<T>, type = ReactionType.Both, intents: GatewayIntentBits[] = [], permissions: PermissionsString[] = [], priorityIndex?: number): void {
	registerListener("ReactionListener", { tester, handler, type, intents, permissions, priorityIndex });
}

export function registeredIntents(): IntentsBitField {
	const registered: GatewayIntentBits[] = [];
	messageListeners.forEach(listener => registered.push(...listener.intents));
	reactionListeners.forEach(listener => registered.push(...listener.intents));

	const intents = new IntentsBitField();
	intents.add(
		// registered.filter(utils.ArrayUtils.Filters.unique)
		[
		IntentsBitField.Flags.DirectMessages,
		IntentsBitField.Flags.DirectMessageReactions,
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildEmojisAndStickers,
		IntentsBitField.Flags.GuildInvites,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildMessageReactions,
		IntentsBitField.Flags.GuildModeration,
		IntentsBitField.Flags.GuildPresences,
		IntentsBitField.Flags.GuildWebhooks,
		IntentsBitField.Flags.MessageContent
	]);
	return intents;
}

//#endregion

//#region interactions

export async function handleInteraction(interaction: Interaction): Promise<THandlerOutput> {
	const output = { tested: 0, handled: 0 };
	try {
		const isCommand = interaction.isChatInputCommand();
		const isButton = interaction.isButton();
		const isSelectMenu = interaction.isStringSelectMenu();
		const isModalSubmit = interaction.isModalSubmit();
		if (isCommand || isButton || isSelectMenu || isModalSubmit) {
			const sageInteraction = await SageInteraction.fromInteraction(interaction);
			await handleInteractions(sageInteraction, output);
		}
	}catch(ex) {
		console.error(toHumanReadable(interaction.user), interaction.toJSON(), ex);
	}
	return output;
}

async function handleInteractions(sageInteraction: SageInteraction<any>, output: THandlerOutput): Promise<void> {
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
		const isNotBotOrIsAcceptableBot = !message.author?.bot || isAcceptableBot(message.author.id);
		const isNotWebhook = !message.webhookId;
		const isNotEditWeCanIgnore = !isEditWeCanIgnore(message, originalMessage);
		if (isNotBotOrIsAcceptableBot && isNotWebhook && isNotEditWeCanIgnore) {
			const sageMessage: SageMessage = await SageMessage.fromMessage(message, originalMessage);
			await handleMessages(sageMessage, messageType, output);
		}
	} catch (ex) {
		console.error(toHumanReadable(message.author), `\`${message.content}\``, ex);
	}
	return output;
}

async function handleMessages(sageMessage: SageMessage, messageType: MessageType, output: THandlerOutput): Promise<void> {
	for (const listener of messageListeners) {
		if (isActionableType(listener, messageType)) {
			// const clonedMessage = sageMessage.clone();
			const commandAndArgsAndData = <TCommandAndArgsAndData<any>>await listener.tester(sageMessage);
			output.tested++;
			if (isActionableObject(commandAndArgsAndData)) {
				sageMessage.setCommandAndArgs(commandAndArgsAndData);
				await listener.handler(sageMessage, commandAndArgsAndData.data);
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
		const isNotBotOrIsAcceptableBot = !user.bot || isAcceptableBot(user.id);
		if (isNotBotOrIsAcceptableBot) {
			const sageReaction = await SageReaction.fromMessageReaction(messageReaction, user, reactionType);
			await handleReactions(sageReaction, reactionType, output);
		}
	} catch (ex) {
		console.error(toHumanReadable(user), `\`${messageReaction.emoji.name}\``, ex);
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
