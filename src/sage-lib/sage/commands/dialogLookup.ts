import { errorReturnUndefined, type Optional, type RenderableContent, type Snowflake } from "@rsc-utils/core-utils";
import { isSageId, isTupperBoxId, toMessageUrl, toUserMention } from "@rsc-utils/discord-utils";
import type { Guild, Message, TextChannel } from "discord.js";
import { ReactionType } from "../../discord/enums.js";
import { registerReactionListener } from "../../discord/handlers.js";
import { registerListeners } from "../../discord/handlers/registerListeners.js";
import type { TCommand } from "../../discord/types.js";
import { GameUserType, type Game } from "../model/Game.js";
import type { GameCharacter } from "../model/GameCharacter.js";
import { ColorType } from "../model/HasColorsCore.js";
import { EmojiType } from "../model/HasEmojiCore.js";
import type { SageCommand } from "../model/SageCommand.js";
import type { SageReaction } from "../model/SageReaction.js";
import { SageMessageReference } from "../repo/SageMessageReference.js";
import { createRenderableContent } from "./helpers/createRenderableContent.js";

async function whisper(sageCommand: SageCommand, content: string | RenderableContent): Promise<void> {
	let renderable: RenderableContent;
	if (typeof(content) === "string") {
		renderable = createRenderableContent(sageCommand.getHasColors(), ColorType.Command);
		renderable.append(content);
	}else {
		renderable = content;
	}

	await sageCommand.replyStack.whisper(content, { forceEphemeral:true });
	let sent = sageCommand.replyStack.replied;
	if (!sent) {
		// renderable.append(`*Note: We tried to DM this alert to you, but were unable to.*`);
		const opts = sageCommand.resolveToOptions(renderable);
		const actor = await sageCommand.eventCache.validateActor();
		const dm = await actor.discord?.send(opts).catch(errorReturnUndefined);
		if (dm) {
			sent = true;
		}
	}
	if (sent && sageCommand.isSageReaction()) {
		const reaction = await sageCommand.fetchMessageReaction();
		reaction.remove();
	}
}

/** webhookOwnerId should be Sage's userId; authorId could be a user or it could be a proxied character! */
async function getAuthorOwnerIds(message: Message) {
	const { author:{ id:authorId }, webhookId } = message;
	let webhookOwnerId: string | undefined;

	// start with channel
	let channel = message.channel;

	// if it doesn't have webhooks, grab parent
	if (!("fetchWebhooks" in channel) && ("parent" in channel)) {
		channel = channel.parent as TextChannel;
	}

	// if we have webhooks, fetch em and test
	if ("fetchWebhooks" in channel) {
		const webhooks = await channel.fetchWebhooks();

		// start with webhook id
		if (webhookId) {
			webhookOwnerId = webhooks.get(webhookId)?.owner?.id;
		}

		// check the author id ... just in case
		if (!webhookOwnerId) {
			/** @todo find time to run down what that authorId represents when webhookId and authorId don't link back to Sage */
			webhookOwnerId = webhooks.get(authorId)?.owner?.id;
		}
	}

	// const isClyde = isClydeId(authorId) || isClydeId(webhookOwnerId);

	const isSage = isSageId(authorId) || isSageId(webhookOwnerId);

	const isTupperBox = isTupperBoxId(authorId) || isTupperBoxId(webhookOwnerId);

	return {
		// authorId,
		// isClyde,
		isSage,
		isTupperBox,
		// webhookOwnerId
	};
}

function getMessageLink(message: Message): string {
	return `<b>Message:</b> ${toMessageUrl(message)}`;
}

/** null means no messageInfo, undefined means not found */
function getCharacterName(character: Optional<GameCharacter>): string {
	if (character === null) {
		return "<b>Character:</b> <i>no character</i>";
	}

	if (character === undefined) {
		return "<b>Character:</b> <i>unable to find character</i>";
	}

	let type: string;
	switch(character.type) {
		case "gm": type = "(GM)"; break; // NOSONAR
		case "npc": case "minion": type = "(NPC)"; break; // NOSONAR
		default: type = ""; break; // NOSONAR
	}
	return `<b>Character:</b> ${character.name} ${type}`.trim();
}

function isClydeId(id?: string): id is "1187126825042858149" {
	return id === "1187126825042858149";
}

async function getUserName(game: Optional<Game>, ...ids: Optional<string>[]): Promise<string> {
	const ret = (id: string) => {
		const userName = toUserMention(id as Snowflake);
		const gm = game?.getUser(id)?.type === GameUserType.GameMaster ? " (GM)" : "";
		return `<b>User:</b> ${userName}${gm}`;
	};

	for (const id of ids) {
		if (id && !isClydeId(id) && !isSageId(id)) {
			return ret(id);
		}
	}

	for (const id of ids) {
		if (id && !isClydeId(id)) {
			return ret(id);
		}
	}

	return `<b>User:</b> <i>Unknown User</i>`;
}

function getGameName(game: Optional<Game>): string {
	if (game?.isArchived) {
		return `<b>Game:</b> ${game.name} <i>(archived)</i>`;
	}else {
		return `<b>Game:</b> ${game?.name ?? "<i>no game</i>"}`;
	}
}

function getServerName(guild: Optional<Guild>): string {
	return `<b>Server:</b> ${guild?.name ?? "<i>no server</i>"}`;
}

async function processSageDialog(sageCommand: SageCommand, message: Message): Promise<void> {
	const sendLookup = async (game?: Game, character?: Optional<GameCharacter>, userId?: Snowflake) => {
		const renderable = createRenderableContent(sageCommand.getHasColors(), ColorType.Command, "RPG Sage Dialog Lookup");
		renderable.append(getMessageLink(message));
		renderable.append(getCharacterName(character));
		renderable.append(await getUserName(game, userId, message.author.id));
		renderable.append(getGameName(game));
		if (character) {
			renderable.setThumbnailUrl(character.tokenUrl ?? character.avatarUrl);
			if (game && !game?.findCharacterOrCompanion(character.id)) {
				renderable.append(`> *NOTE: This character is a User Character, **NOT** a Game Character.*`);
			}
		}
		renderable.append(getServerName(sageCommand.discord.guild));

		await whisper(sageCommand, renderable);
	};

	const messageInfo = await SageMessageReference.read(message, { ignoreMissingFile:true });
	if (!messageInfo) {
		if (sageCommand.game) {
			await sendLookup(sageCommand.game, null);
			return;
		}

		await whisper(sageCommand, `Sorry, we could't find any RPG Sage Dialog info for that message.`);
		return;
	}

	const { characterId, gameId, userId } = messageInfo;

	// get game to lookup character
	const game = await sageCommand.eventCache.getOrFetchGame(gameId);

	// get user to lookup character
	const sageUser = await sageCommand.eventCache.getOrFetchUser(userId);

	/** we can't use sageCommand.findCharacter because the game and user aren't linked to the command */
	const character = game?.playerCharacters.findById(characterId)
		?? game?.nonPlayerCharacters.findById(characterId)
		?? (game?.gmCharacter.equals(characterId) ? game.gmCharacter : undefined)
		?? (sageCommand.server?.gmCharacter.equals(characterId) ? sageCommand.server.gmCharacter : undefined)
		?? sageUser?.playerCharacters.findById(characterId)
		?? sageUser?.nonPlayerCharacters.findById(characterId);

	await sendLookup(game, character, userId);
}

async function processTupperDialog(sageCommand: SageCommand): Promise<void> {
	const content = `That message was posted by [Tupperbox](<https://tupperbox.app>). React to it with :question: to get a response from Tupperbox.`;
	return whisper(sageCommand, content);
}

async function isDialogLookup(sageReaction: SageReaction): Promise<TCommand | null> {
	// check the appropriate lookup emoji
	const deleteEmoji = sageReaction.getEmoji(EmojiType.CommandLookup);
	const emoji = sageReaction.emoji;
	if (emoji.name !== deleteEmoji) {
		return null;
	}

	const message = await sageReaction.fetchMessage();
	if (!message.guild) {
		return null;
	}

	const { isSage, isTupperBox } = await getAuthorOwnerIds(message);

	if (isSage) {
		return { command: "CommandLookup|Add" };
	}

	if (!isTupperBox || sageReaction.game) {
		return { command: "CommandLookup|Add" };
	}

	return null;
}

async function dialogLookup(sageCommand: SageCommand): Promise<void> {
	const message = await sageCommand.fetchMessage();

	if (!message?.guild) {
		return whisper(sageCommand, `RPG Sage doesn't do Dialog in DMs.`);
	}

	if (message) {
		const { isSage, isTupperBox } = await getAuthorOwnerIds(message);

		if (isTupperBox && !sageCommand.isSageReaction()) {
			return processTupperDialog(sageCommand);
		}

		if (isSage || sageCommand.game) {
			if (sageCommand.isSageReaction()) {
				const reaction = await sageCommand.fetchMessageReaction();
				reaction.remove();
			}
			return processSageDialog(sageCommand, message);
		}

	}

	return whisper(sageCommand, `Sorry, we could't find any RPG Sage Dialog info for that message.`);
}

export function registerDialogLookup(): void {
	registerListeners({ commands:["Dialog Lookup"], interaction:dialogLookup });
	registerReactionListener(isDialogLookup, dialogLookup, { type:ReactionType.Add });
}