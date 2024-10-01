import type { MessageContextMenuCommandInteraction } from "discord.js";
import { registerListeners } from "../../discord/handlers/registerListeners";
import type { SageInteraction } from "../model/SageInteraction";
import { DialogMessageRepository } from "../repo/DialogMessageRepository";
import { DiscordKey, toHumanReadable } from "@rsc-utils/discord-utils";
import { getTupperBoxId } from "@rsc-sage/env";

export async function dialogLookup(sageInteraction: SageInteraction<MessageContextMenuCommandInteraction>): Promise<void> {
	const message = sageInteraction.interaction.targetMessage;
	if (!message.author.bot || message.author.id !== sageInteraction.bot.did) {
		if (message.author.id === getTupperBoxId()) {
			return sageInteraction.replyStack.whisper({ content:`Sorry, this message was posted by [Tupperbox](<https://tupperbox.app>).`, ephemeral:true });
		}
		return sageInteraction.replyStack.whisper({ content:`Sorry, this message wasn't posted by RPG Sage.`, ephemeral:true });
	}

	const discordKey = DiscordKey.from(message);
	const messageInfo = await DialogMessageRepository.read(discordKey);
	if (!messageInfo) {
		return sageInteraction.replyStack.whisper({ content:`Sorry, we could't find any RPG Sage Dialog info.`, ephemeral:true });
	}

	const { characterId, gameId, userDid } = messageInfo;

	const sageUser = await sageInteraction.sageCache.users.getByDid(userDid);
	const guildMember = await sageInteraction.discord.fetchGuildMember(userDid);
	const discordUser = guildMember?.user ?? await sageInteraction.discord.fetchUser(userDid);

	let { game } = sageInteraction;
	if (game && !game.equals(gameId)) {
		game = await sageInteraction.sageCache.games.getById(gameId) ?? undefined;
	}

	const character = game?.playerCharacters.findById(characterId)
		?? game?.nonPlayerCharacters.findById(characterId)
		?? (game?.gmCharacter.equals(characterId) ? game.gmCharacter : undefined)
		?? (sageInteraction.server.gmCharacter.equals(characterId) ? sageInteraction.server.gmCharacter : undefined)
		?? sageUser?.playerCharacters.findById(characterId)
		?? sageUser?.nonPlayerCharacters.findById(characterId);

	if (!character) {
		return sageInteraction.replyStack.whisper({ content:`Sorry, we could't find the RPG Sage Character.`, ephemeral:true });
	}

	const details: string[] = [];
	details.push(`<b>Character Name:</b> ${character.name}`);
	details.push(`<b>User Name:</b> ${toHumanReadable(guildMember ?? discordUser)}`);
	if (game?.archivedDate) {
		details.push(`<b>Game Name:</b> ${game.name} <i>(archived)</i>`);
	}else {
		details.push(`<b>Game Name:</b> ${game?.name ?? "<i>no game</i>"}`);
	}
	details.push(`<b>Server Name:</b> ${sageInteraction.interaction.guild?.name ?? "<i>no server</i>"}`);

	await sageInteraction.replyStack.whisper({ content:details.join("\n"), ephemeral:true });
}

export function registerDialogLookup(): void {
	registerListeners({ commands:["Dialog Lookup"], interaction:dialogLookup });
}
