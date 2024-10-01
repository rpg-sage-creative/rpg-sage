import type { Message } from "discord.js";
import { sendWebhook } from "../../../../discord/messages.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

export async function sendGameCharacterMods(sageMessage: SageMessage, character: GameCharacter, statModKeys: string[]): Promise<Message[]> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	if (character.embedColor) {
		renderableContent.setColor(character.embedColor);
	}
	if (character.avatarUrl) {
		renderableContent.setThumbnailUrl(character.avatarUrl);
	}

	renderableContent.appendTitledSection(`<b>Stats Updated</b>`);

	statModKeys.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);

	statModKeys.forEach(key => {
		const value = character.getStat(key);
		if (value) {
			renderableContent.append(`<b>${key}</b> ${value}`);
		}else {
			renderableContent.append(`<s><b>${key}</b></s>`);
		}
	});

	const targetChannel = sageMessage.message.channel;
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;

	const sageCache = sageMessage.caches;
	const authorOptions = { avatarURL: avatarUrl, username: character.name };
	const dialogType = sageMessage.dialogPostType;
	const messages = await sendWebhook(targetChannel, { authorOptions, dialogType, renderableContent, sageCache });
	return messages ?? [];
}