import { mapAsync } from "@rsc-utils/async-array-utils";
import type { Message } from "discord.js";
import { toHumanReadable } from "../../../../../sage-utils/utils/DiscordUtils/toHumanReadable";
import { DiscordId, type TChannel } from "../../../../discord";
import { sendWebhook } from "../../../../discord/messages";
import type GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";
import { DialogType } from "../../../repo/base/IdRepository";
import { createAdminRenderableContent } from "../../cmd";
import { toReadableOwner } from "./toReadableOwner";

export async function sendGameCharacter(sageMessage: SageMessage, character: GameCharacter): Promise<Message[]> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	if (character.embedColor) {
		renderableContent.setColor(character.embedColor);
	}
	if (character.avatarUrl) {
		renderableContent.setThumbnailUrl(character.avatarUrl);
	}

	renderableContent.append(`<b>Alias</b> ${character.alias ?? "<i>unset</i>"}`);

	const ownerOrPlayer = character.isGMorNPC ? "Owner" : "Player";
	const ownerTag = await toReadableOwner(sageMessage, character.userDid);
	renderableContent.append(`<b>${ownerOrPlayer}</b> ${ownerTag ?? "<i>none</i>"}`);

	if (character.isCompanion) {
		renderableContent.append(`<b>Character</b> ${character.parent?.name ?? "<i>unknown</i>"}`);
	} else {
		const companionNames = character.companions.map(companion => companion.name).join("\n- ");
		renderableContent.append(`<b>Companions</b> ${companionNames || "<i>none</i>"}`);
	}
	renderableContent.append(`<b>Dialog Color</b> ${character.embedColor ?? "<i>unset</i>"}`);

	const autoChannels = character.autoChannels;
	const autoChannelItems = await mapAsync(autoChannels, async data => {
		const parts: string[] = [];
		parts.push(DiscordId.toChannelReference(data.channelDid) ?? data.channelDid);
		if (data.dialogPostType !== undefined) {
			parts.push(`(${DialogType[data.dialogPostType]})`);
		}
		if (data.userDid && character.userDid !== data.userDid) {
			const user = await sageMessage.discord.fetchGuildMember(data.userDid);
			parts.push(toHumanReadable(user) ?? data.userDid);
		}
		return parts.join(" ");
	});
	if (autoChannelItems.length) {
		const autoChannelList = autoChannelItems.map(s => `\n- ${s}`).join("");
		renderableContent.append(`<b>Auto Dialog</b>${autoChannelList}`);
	}else {
		renderableContent.append(`<b>Auto Dialog</b> <i>none</i>`);
	}

	const stats = character.notes.getStats().map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note);
	if (stats.length) {
		renderableContent.appendTitledSection(`<b>Stats</b>`, ...stats);
	}

	const notes = character.notes.getUncategorizedNotes().map(note => note.title ? `<b>${note.title}</b> ${note.note}` : note.note);
	if (notes.length) {
		renderableContent.appendTitledSection(`<b>Notes</b>`, ...notes);
	}

	const targetChannel = (await sageMessage.caches.discord.fetchChannel(sageMessage.channel?.sendCommandTo)) ?? sageMessage.message.channel as TChannel;
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;

	const sageCache = sageMessage.caches;
	const authorOptions = { avatarURL: avatarUrl, username: character.name };
	const dialogType = sageMessage.dialogType;
	return sendWebhook(targetChannel, { authorOptions, dialogType, renderableContent, sageCache });
}