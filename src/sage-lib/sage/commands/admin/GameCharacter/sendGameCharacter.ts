import { mapAsync } from "@rsc-utils/array-utils";
import { toChannelMention, toHumanReadable } from "@rsc-utils/discord-utils";
import type { Message } from "discord.js";
import { canProcessStats, statsToHtml } from "../../../../../gameSystems/sheets.js";
import { sendWebhook } from "../../../../discord/messages.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { toReadableOwner } from "./toReadableOwner.js";

export async function sendGameCharacter(sageMessage: SageMessage, character: GameCharacter): Promise<Message[]> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	if (character.embedColor) {
		renderableContent.setColor(character.embedColor);
	}
	if (character.avatarUrl) {
		renderableContent.setThumbnailUrl(character.avatarUrl);
	}

	renderableContent.append(`<b>Alias</b> ${character.alias ?? "<i>unset</i>"}`);

	const ownerOrPlayer = character.isGmOrNpc ? "Owner" : "Player";
	const ownerTag = await toReadableOwner(sageMessage, character.userDid);
	renderableContent.append(`<b>${ownerOrPlayer}</b> ${ownerTag ?? "<i>none</i>"}`);

	if (character.isCompanion || character.isMinion) {
		renderableContent.append(`<b>Character</b> ${character.parent?.name ?? "<i>unknown</i>"}`);
	} else {
		const companionNames = character.companions.map(companion => companion.name).join("\n- ");
		const companionType = character.isPc ? `Companions` : `Minions`;
		renderableContent.append(`<b>${companionType}</b> ${companionNames || "<i>none</i>"}`);
	}
	renderableContent.append(`<b>Dialog Color</b> ${character.embedColor ?? "<i>unset</i>"}`);

	const autoChannels = character.autoChannels;
	const autoChannelItems = await mapAsync(autoChannels, async data => {
		const parts: string[] = [];
		parts.push(toChannelMention(data.channelDid) ?? data.channelDid);
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

	if (character.hasStats) {
		const { isGmOrNpcOrMinion } = character;
		const gmChannel = isGmOrNpcOrMinion ? await sageMessage.game?.gmGuildChannel() : undefined;
		const hasGmChannel = !!gmChannel;
		const isGmChannel = gmChannel ? gmChannel.id === sageMessage.channelDid : false;
		if (isGmOrNpcOrMinion && hasGmChannel && !isGmChannel) {
			renderableContent.appendTitledSection(`<b>Stats</b>`, `<i>NPC stats viewable in GM channel ...</i>`);

		}else {
			let statsTitle = "Stats";
			if (canProcessStats(character)) {
				const { gameSystem } = character;
				renderableContent.appendTitledSection(`<b>Stats</b> ${gameSystem?.code}`, ...statsToHtml(character));
				statsTitle = "Other Stats";
			}
			const stats = character.getNonGameStatsOutput();
			if (stats.length) {
				renderableContent.appendTitledSection(`<b>${statsTitle}</b>`, ...stats);
			}
		}
	}

	const targetChannel = sageMessage.message.channel;
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;

	const sageCache = sageMessage.caches;
	const authorOptions = { avatarURL: avatarUrl, username: character.toDisplayName() };
	const dialogType = sageMessage.dialogPostType;
	const messages = await sendWebhook(targetChannel, { authorOptions, dialogType, renderableContent, sageCache });
	return messages ?? [];
}