import { isSageId, isTupperBoxId } from "@rsc-sage/env";
import { errorReturnNull, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { DiscordKey, toMessageUrl, toUserMention } from "@rsc-utils/discord-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Guild, GuildMember, Message } from "discord.js";
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
import { DialogMessageRepository } from "../repo/DialogMessageRepository.js";
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
		const user = await sageCommand.discord.fetchUser(sageCommand.authorDid);
		const dm = await user?.send(opts).catch(errorReturnNull);
		if (dm) sent = true;
	}
	if (sent && sageCommand.isSageReaction()) {
		const reaction = await sageCommand.fetchMessageReaction();
		reaction.remove();
	}
}

async function getAuthorId(message: Message): Promise<Snowflake> {
	const { author, channel, webhookId } = message;
	if (webhookId && "fetchWebhooks" in channel) {
		const webhooks = await channel.fetchWebhooks();
		const webhook = webhooks.get(webhookId);
		if (webhook?.owner) {
			return webhook.owner.id as Snowflake;
		}
	}
	return author.id as Snowflake;
}

function getMessageLink(message: Message): string {
	return `<b>Message:</b> ${toMessageUrl(message)}`;
}

function getCharacterName(character?: Optional<GameCharacter>): string {
	let type: string;
	switch(character?.type) {
		case "gm": type = "(GM)"; break;
		case "npc": case "companion": type = "(NPC)"; break;
		default: type = ""; break;
	}
	return `<b>Character:</b> ${character?.name ?? "<i>no character</i>"} ${type}`;
}

async function getUserName({ discord }: SageCommand, guildMember: Optional<GuildMember>, userId: Snowflake, game: Optional<Game>): Promise<string> {
	const parts: string[] = [];

	parts.push(`<b>User:</b>`);

	const discordUser = guildMember?.user ?? await discord.fetchUser(userId);
	const userName = toUserMention(guildMember ?? discordUser ?? userId);
	parts.push(userName ?? "<i>Unknown User</i>");

	const gameUser = game?.getUser(userId);
	if (gameUser?.type === GameUserType.GameMaster) {
		parts.push(`(GM)`);
	}

	return parts.join(" ");
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
	const discordKey = DiscordKey.from(message);
	const messageInfo = await DialogMessageRepository.read(discordKey);
	if (!messageInfo) {
		return whisper(sageCommand, `Sorry, we could't find any RPG Sage Dialog info for that message.`);
	}

	const { characterId, gameId, userDid } = messageInfo;

	const sageUser = await sageCommand.sageCache.users.getByDid(userDid);
	const guildMember = await sageCommand.discord.fetchGuildMember(userDid);

	let { game } = sageCommand;
	if (game && !game.equals(gameId)) {
		game = await sageCommand.sageCache.games.getById(gameId) ?? undefined;
	}

	/** we can't use sageCommand.findCharacter because the game and user aren't linked to the command */
	const character = game?.playerCharacters.findById(characterId)
		?? game?.nonPlayerCharacters.findById(characterId)
		?? (game?.gmCharacter.equals(characterId) ? game.gmCharacter : undefined)
		?? (sageCommand.server.gmCharacter.equals(characterId) ? sageCommand.server.gmCharacter : undefined)
		?? sageUser?.playerCharacters.findById(characterId)
		?? sageUser?.nonPlayerCharacters.findById(characterId);

	if (!character) {
		return whisper(sageCommand, `Sorry, we could't find the RPG Sage Character.`);
	}

	const isGameChar = game?.findCharacterOrCompanion(character.id);

	const renderable = createRenderableContent(sageCommand.getHasColors(), ColorType.Command, "RPG Sage Dialog Lookup");
	renderable.setThumbnailUrl(character.tokenUrl ?? character.avatarUrl);
	renderable.append(getMessageLink(message));
	renderable.append(getCharacterName(character));
	renderable.append(await getUserName(sageCommand, guildMember, userDid, game));
	renderable.append(getGameName(game));
	if (game && !isGameChar) {
		renderable.append(`> *NOTE: This character is a User Character, **NOT** a Game Character.*`);
	}
	renderable.append(getServerName(sageCommand.discord.guild));

	await whisper(sageCommand, renderable);
}

async function processTupperDialog(sageCommand: SageCommand): Promise<void> {
	const content = `That message was posted by [Tupperbox](<https://tupperbox.app>). React to it with :question: to get a response from Tupperbox.`
	return whisper(sageCommand, content);
}

async function processGameDialog(sageCommand: SageCommand): Promise<void> {
	const { game } = sageCommand;
	const message = await sageCommand.fetchMessage();
	const guildMember = message?.member;

	const renderable = createRenderableContent(sageCommand.getHasColors(), ColorType.Command, "RPG Sage Dialog Lookup");
	renderable.append(getMessageLink(message!));
	renderable.append(getCharacterName());
	renderable.append(await getUserName(sageCommand, guildMember, message?.author.id as Snowflake, game));
	renderable.append(getGameName(game));
	renderable.append(getServerName(sageCommand.discord.guild));

	await whisper(sageCommand, renderable);
}

async function isDialogLookup(sageReaction: SageReaction): Promise<TCommand | null> {
	// check the appropriate lookup emoji
	const deleteEmoji = sageReaction.getEmoji(EmojiType.CommandLookup);
	const emoji = sageReaction.emoji;
	if (emoji.name !== deleteEmoji) {
		return null;
	}

	const message = await sageReaction.fetchMessage();

	const authorId = await getAuthorId(message);
	if (isSageId(authorId)) {
		return { command: "CommandLookup|Add" };
	}
	if (!isTupperBoxId(authorId) || sageReaction.game) {
		return { command: "CommandLookup|Add" };
	}

	return null;
}

async function dialogLookup(sageCommand: SageCommand): Promise<void> {
	const message = await sageCommand.fetchMessage();
	if (message) {
		const authorId = await getAuthorId(message);

		if (isSageId(authorId)) {
			if (sageCommand.isSageReaction()) {
				const reaction = await sageCommand.fetchMessageReaction();
				reaction.remove();
			}
			return processSageDialog(sageCommand, message);
		}

		if (isTupperBoxId(authorId) && !sageCommand.isSageReaction()) {
			return processTupperDialog(sageCommand);
		}

		if (sageCommand.game) {
			if (sageCommand.isSageReaction()) {
				const reaction = await sageCommand.fetchMessageReaction();
				reaction.remove();
			}
			return processGameDialog(sageCommand);
		}
	}
	await whisper(sageCommand, `Sorry, we could't find any RPG Sage Dialog info for that message.`);
}

export function registerDialogLookup(): void {
	registerListeners({ commands:["Dialog Lookup"], interaction:dialogLookup });
	registerReactionListener(isDialogLookup, dialogLookup, { type:ReactionType.Add });
}
