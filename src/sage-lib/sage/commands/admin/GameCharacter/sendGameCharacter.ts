import { SageChannelType } from "@rsc-sage/types";
import { mapAsync, type Optional } from "@rsc-utils/core-utils";
import { toChannelMention, toHumanReadable, toMessageUrl } from "@rsc-utils/discord-utils";
import { stringOrUndefined } from "@rsc-utils/string-utils";
import type { Message } from "discord.js";
import { sendWebhook } from "../../../../discord/messages.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { toReadableOwner } from "./toReadableOwner.js";

function orNone(text: Optional<string>): string {
	return stringOrUndefined(text) ?? "<i>none</i>";
}

function orUnset(text: Optional<string>): string {
	return stringOrUndefined(text) ?? "<i>unset</i>";
}

function orUnknown(text: Optional<string>): string {
	return stringOrUndefined(text) ?? "<i>unknown</i>";
}

export async function sendGameCharacter(sageMessage: SageMessage, character: GameCharacter): Promise<Message[]> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	if (character.embedColor) {
		renderableContent.setColor(character.embedColor);
	}
	if (character.avatarUrl) {
		renderableContent.setThumbnailUrl(character.avatarUrl);
	}

	const nameDescriptors = character.toNameDescriptors();
	if (nameDescriptors) {
		renderableContent.append(`${nameDescriptors.join(" ")}`);
	}

	renderableContent.append(`<b>Alias</b> ${orUnset(character.alias)}`);

	renderableContent.append("");

	const ownerTag = await toReadableOwner(sageMessage, character.userDid);
	renderableContent.append(`<b>Scope</b> ${character.scope}; <b>Owner</b> ${orNone(ownerTag)}`);

	renderableContent.append(`<b>Embed Color</b> ${orUnset(character.embedColor)}`);

	const imageUrls = [
		character.tokenUrl ? `[token](<${character.tokenUrl}>)` : undefined,
		character.avatarUrl ? `[avatar](<${character.avatarUrl}>)` : undefined,
	].filter(s => s);
	const imageLinks = imageUrls.length ? imageUrls.join(" ") : undefined;
	renderableContent.append(`<b>Images</b> ${orNone(imageLinks)}`);

	renderableContent.append("");

	if (character.pathbuilder?.hasSheetRef) {
		renderableContent.append(`<b>Char Sheet</b> ${toMessageUrl(character.pathbuilder.sheetRef!)}`);
	}

	if (character.isCompanion || character.isMinion) {
		renderableContent.append(`<b>Character</b> ${orUnknown(character.parent?.name)}`);
	} else {
		const companionNames = character.companions.map(companion => `\n- ${companion.name}`).join("");
		const companionType = character.isPc ? `Companions` : `Minions`;
		renderableContent.append(`<b>${companionType}</b> ${orNone(companionNames)}`);
	}

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

	const hasStats = character.hasStats || !!character.pathbuilder;
	if (hasStats) {
		let isGmChannel = false;
		let hasGmChannels = false;
		const { isGmOrNpcOrMinion } = character;
		if (isGmOrNpcOrMinion) {
			const { channelDid, game, threadDid } = sageMessage;
			const { channels } = game ?? {};
			const gmChannels = channels?.filter(ch => ch.type === SageChannelType.GameMaster);
			if (gmChannels?.length) {
				hasGmChannels = true;
				if (threadDid) {
					// thread is gm channel
					isGmChannel = gmChannels.some(ch => (ch.did ?? ch.id) === threadDid);
					// thread is not channel and channel is gm channel
					if (!isGmChannel) {
						isGmChannel = !channels?.some(ch => (ch.did ?? ch.id) === threadDid)
							&& gmChannels.some(ch => (ch.did ?? ch.id) === channelDid);
					}
				}else {
					isGmChannel = gmChannels.some(ch => (ch.did ?? ch.id) === channelDid);
				}
			}
		}
		if (isGmOrNpcOrMinion && hasGmChannels && !isGmChannel) {
			renderableContent.appendTitledSection(`<b>Stats</b>`, `<i>NPC stats viewable in GM channel ...</i>`);

		}else {
			const sections = character.toStatsOutput();
			sections.forEach(({ title, lines }) => {
				if (lines.length) {
					renderableContent.appendTitledSection(`<b>${title}</b>`, ...lines);
				}
			});
		}
	}

	const targetChannel = sageMessage.message.channel;
	const webhookOptions = {
		authorOptions: {
			avatarURL: character.tokenUrl ?? sageMessage.bot.tokenUrl,
			username: character.toDisplayName()
		},
		dialogType: sageMessage.dialogPostType,
		renderableContent,
		sageCache: sageMessage.sageCache,
	};
	const messages = await sendWebhook(targetChannel, webhookOptions);
	return messages ?? [];
}