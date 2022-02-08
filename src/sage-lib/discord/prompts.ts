import type * as Discord from "discord.js";
import utils, { Awaitable, Optional } from "../../sage-utils";
import ActiveBot from "../sage/model/ActiveBot";
import type SageMessage from "../sage/model/SageMessage";
import type SageReaction from "../sage/model/SageReaction";
import { NilSnowflake } from "./consts";
import DiscordId from "./DiscordId";
import { resolveToTexts } from "./embeds";
import { registerReactionListener } from "./handlers";
import type { TCommand, TRenderableContentResolvable } from "./types";

const TIMEOUT_MILLI = 60 * 1000;
type TPromptResponseMap = Map<string, string>;
type TReactionHandler = (reaction: string) => Promise<TRenderableContentResolvable | null>;
type TResolveHandler = (response: Awaitable<Optional<string>>) => void;
type TRejectHandler = () => void;
type TPromptMapItem = {
	authorDid: Discord.Snowflake;
	sageMessage: SageMessage;
	responseMap: TPromptResponseMap;
	reactionsSetter: Promise<void>;
	reactionHandler?: TReactionHandler;
	resolveHandler: TResolveHandler;
	rejectHandler: TRejectHandler;
	timeout: NodeJS.Timeout;
};

const messageToPromptMessageMap: Map<Discord.Snowflake, Discord.Message> = new Map();
const promptMap: Map<Discord.Snowflake, TPromptMapItem> = new Map();

async function canHandlePromptReaction(sageReaction: SageReaction): Promise<TCommand | null> {
	const messageReaction = sageReaction.messageReaction;

	const promptMessageDid = messageReaction.message.id;
	if (!promptMap.has(promptMessageDid)) {
		return null;
	}

	const promptMapItem = promptMap.get(promptMessageDid)!;
	if (sageReaction.user.id !== promptMapItem.authorDid) {
		/*
		// await reaction.remove();
		*/
		return null;
	}

	const responseMap = promptMapItem.responseMap;
	const emoji = responseMap.get(messageReaction.emoji.name!) ?? responseMap.get(messageReaction.emoji.id!) ?? null;
	if (!emoji) {
		/*
		// await reaction.remove();
		*/
		return null;
	}

	return { command: "prompt-answer" };
}

async function handlePromptReaction(sageReaction: SageReaction): Promise<void> {
	const messageReaction = sageReaction.messageReaction;
	const promptMapItem = promptMap.get(messageReaction.message.id)!;
	const responseMap = promptMapItem.responseMap;
	const emoji = responseMap.get(messageReaction.emoji.name!) ?? responseMap.get(messageReaction.emoji.id!) ?? null;
	const update = emoji && promptMapItem.reactionHandler ? await promptMapItem.reactionHandler(emoji) : null;
	const renderableContent = update ? utils.RenderUtils.RenderableContent.resolve(update) : null;
	if (update && renderableContent) {
		const formattedText = resolveToTexts(promptMapItem.sageMessage.caches, renderableContent);
		await promptMapItem.sageMessage.message.edit(formattedText.join(""));
		/*
		// await reaction.remove();
		*/
		return promptMapItem.reactionsSetter.then(() => {
			clearTimeout(promptMapItem.timeout);
			promptMapItem.timeout = setTimeout(clearHandler, TIMEOUT_MILLI, promptMapItem.sageMessage.message, true);
		});
	} else {
		return promptMapItem.reactionsSetter.then(() => {
			promptMapItem.resolveHandler(emoji);
			clearHandler(messageReaction.message);
		});
	}
}

export default function register(): void {
	registerReactionListener(canHandlePromptReaction, handlePromptReaction);
}

/**
 * Resolves a prompt's promise, removes it from the map, and removes bot's reactions.
 * Resolved value is NULL if timed out, undefined otherwise.
 */
function clearHandler(promptMessage: Discord.Message | Discord.PartialMessage, timeout?: boolean): void {
	const promptMessageDid = promptMessage.id;
	if (promptMap.has(promptMessageDid)) {
		promptMap.get(promptMessageDid)!.resolveHandler(timeout ? null : undefined);
	}
	promptMap.delete(promptMessage.id);

	messageToPromptMessageMap.forEach((value, key) => {
		if (value.id === promptMessageDid) {
			messageToPromptMessageMap.delete(key);
		}
	});

	/*
	// promptMessage.reactions.removeAll();
	*/
	const activeBotDid = ActiveBot.active.did;
	promptMessage.reactions.valueOf().forEach((messageReaction/*, map*/) => {
		messageReaction.users.remove(activeBotDid);
	});
}

export async function discordPromptYesNo(sageMessage: SageMessage, resolvable: TRenderableContentResolvable): Promise<boolean | null> {
	const yes = sageMessage.caches.emojify("[yes]");
	const no = sageMessage.caches.emojify("[no]");

	const responseMap = new Map<string, string>();
	responseMap.set(yes, yes);
	responseMap.set(no, no);

	const response = await discordPrompt(sageMessage, resolvable, responseMap).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
	switch(response) {
		case yes: return true;
		case no: return false;
		default: return null;
	}
}

async function setReactions(promptMessage: Discord.Message, responseMap: TPromptResponseMap): Promise<void> {
	for (const key of responseMap.keys()) {
		try {
			if (DiscordId.isCustomEmoji(key)) {
				const emojiDid = DiscordId.parseId(key);
				responseMap.set(emojiDid, responseMap.get(key)!);
				await promptMessage.react(emojiDid);
			} else {
				await promptMessage.react(key);
			}
		} catch (ex) {
			console.error(ex);
		}
	}
}

export function discordPrompt(sageMessage: SageMessage, resolvable: TRenderableContentResolvable, responseMap: TPromptResponseMap, reactionHandler?: TReactionHandler): Promise<Optional<string>> {
	return new Promise<Optional<string>>(async (resolve: TResolveHandler, reject: TRejectHandler) => {
		/*
		// if (!handlingPrompts) {
		// 	handlingPrompts = true;
		// 	client.on("messageReactionAdd", handlePromptReaction);
		// 	client.on("messageReactionRemove", handlePromptReaction);
		// }

		// const renderableContent = utils.RenderUtils.RenderableContent.resolve(resolvable);
		// const formattedText = await resolveToTexts(sageMessage.sageCache, renderableContent);
		*/
		const promptMessage = (await sageMessage.send(resolvable)).slice(-1)[0];

		messageToPromptMessageMap.set(sageMessage.message.id, promptMessage);

		promptMap.set(promptMessage.id, {
			authorDid: sageMessage.message.author?.id ?? NilSnowflake,
			sageMessage: sageMessage,
			responseMap: responseMap,
			reactionsSetter: setReactions(promptMessage, responseMap),
			reactionHandler: reactionHandler,
			resolveHandler: resolve,
			rejectHandler: reject,
			timeout: setTimeout(clearHandler, TIMEOUT_MILLI, promptMessage, true)
		});
	});
}
