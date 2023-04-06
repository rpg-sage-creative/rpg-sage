import { Message } from "discord.js";
import { GameCharacter } from "../../../model/GameCharacter";
import { SageMessage } from "../../../model/SageMessage";
import { createAdminRenderableContent } from "../../cmd";
import { sendWebhook } from "../../../../discord/messages";
import { DiscordId } from "../../../../../sage-utils/DiscordUtils";

export async function sendGameCharacter(sageMessage: SageMessage, character: GameCharacter): Promise<Message[]> {
	const ownerGuildMember = character.userDid ? await sageMessage.discord.fetchGuildMember(character.userDid) : null,
		ownerTag = ownerGuildMember?.user ? `@${ownerGuildMember.user.tag}` : ownerGuildMember?.displayName ?? character.userDid,
		renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	renderableContent.setColor(character.embedColor);
	renderableContent.setThumbnailUrl(character.images.getUrl("dialog"));

	const ownerOrPlayer = character.isGMorNPC ? "Owner" : "Player";
	renderableContent.append(`<b>${ownerOrPlayer}</b> ${ownerTag ?? "<i>none</i>"}`);
	if (character.isCompanion) {
		renderableContent.append(`<b>Character</b> ${character.parent?.name ?? "<i>unknown</i>"}`);
	} else {
		const companionNames = character.companions.map(companion => companion.name).join(", ");
		renderableContent.append(`<b>Companions</b> ${companionNames || "<i>none</i>"}`);
	}
	renderableContent.append(`<b>Dialog Color</b> ${character.embedColor ?? "<i>unset</i>"}`);

	const autoChannels = character.autoChannels;
	const autoChannelLinks = autoChannels.map(channelDid => DiscordId.toChannelReference(channelDid)).join(", ");
	renderableContent.append(`<b>Auto Dialog</b> ${autoChannelLinks || "<i>none</i>"}`);

	const stats = character.notes.getStats().map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note);
	if (stats.length) {
		renderableContent.appendTitledSection(`<b>Stats</b>`, ...stats);
	}

	const notes = character.notes.getUncategorizedNotes().map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note);
	if (notes.length) {
		renderableContent.appendTitledSection(`<b>Notes</b>`, ...notes);
	}

	const targetChannel = sageMessage.message.channel;
	const avatarUrl = character.images.getUrl("avatar") ?? sageMessage.bot.avatarUrl;
	return sendWebhook(sageMessage.sageCache, targetChannel, renderableContent, { avatarURL: avatarUrl, username: character.name }, sageMessage.dialogType);
}