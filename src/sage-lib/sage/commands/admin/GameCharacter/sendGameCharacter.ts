import { SageChannelType } from "@rsc-sage/types";
import { mapAsync, stringOrUndefined, type Optional } from "@rsc-utils/core-utils";
import { toChannelMention, toMessageUrl } from "@rsc-utils/discord-utils";
import type { Message } from "discord.js";
import { sendWebhook } from "../../../../discord/messages.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { DialogType } from "../../../repo/base/IdRepository.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { StatMacroProcessor } from "../../dice/stats/StatMacroProcessor.js";

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

	const ownerTag = await sageMessage.fetchReadableUser(character.userDid);
	renderableContent.append(`<b>Scope</b> ${character.scope}; <b>Owner</b> ${orNone(ownerTag)}`);

	renderableContent.append(`<b>Embed Color</b> ${orUnset(character.embedColor)}`);

	const imageUrls = [
		character.tokenUrl ? `[token](<${character.tokenUrl}>)` : undefined,
		character.avatarUrl ? `[avatar](<${character.avatarUrl}>)` : undefined,
	].filter(s => s);
	const imageLinks = imageUrls.length ? imageUrls.join(" ") : undefined;
	renderableContent.append(`<b>Images</b> ${orNone(imageLinks)}`);

	renderableContent.append("");

	const { sheetRef } = character.essence20 ?? character.pathbuilder ?? character.hephaistos ?? { };
	if (sheetRef) {
		renderableContent.append(`<b>Char Sheet</b> ${toMessageUrl(sheetRef)}`);
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
			const userName = await sageMessage.fetchReadableUser(data.userDid);
			parts.push(userName ?? data.userDid);
		}
		return parts.join(" ");
	});
	if (autoChannelItems.length) {
		const autoChannelList = autoChannelItems.map(s => `\n- ${s}`).join("");
		renderableContent.append(`<b>Auto Dialog</b>${autoChannelList}`);
	}else {
		renderableContent.append(`<b>Auto Dialog</b> <i>none</i>`);
	}

	const processor = StatMacroProcessor.withStats(sageMessage).for(character);

	if (character.hasStats) {
		let isGmChannel = false;
		let hasGmChannels = false;
		const { isGmOrNpcOrMinion } = character;
		if (isGmOrNpcOrMinion) {
			const { dChannel, game } = sageMessage;
			const validatedChannels = await game?.validateChannels() ?? [];
			const gmChannels = validatedChannels.filter(vc => vc.type === SageChannelType.GameMaster);
			hasGmChannels = gmChannels.length > 0;
			isGmChannel = dChannel?.isThread()
				// thread is not a a validated channel AND thread parent is a gm channel
				? validatedChannels.every(vc => vc.id !== dChannel.id) && gmChannels.some(vc => vc.parent?.id === dChannel.id)
				// channel is a gm channel
				: gmChannels.some(vc => vc.id === dChannel?.id);
		}
		if (isGmOrNpcOrMinion && hasGmChannels && !isGmChannel) {
			renderableContent.appendTitledSection(`<b>Stats</b>`, `<i>NPC stats viewable in GM channel ...</i>`);

		}else {
			const custom = sageMessage.args.hasFlag("--custom");
			const raw = sageMessage.args.hasFlag("--raw");
			const simple = sageMessage.args.hasFlag("--simple");
			const stats = sageMessage.args.hasFlag("--stats");
			const templates = sageMessage.args.hasFlag("--templates");

			const sections = character.toStatsOutput({ simple, custom, processor, raw, stats, templates });
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
			username: character.toDisplayName({ processor })
		},
		dialogType: sageMessage.dialogPostType,
		renderableContent,
		sageCache: sageMessage.sageCache,
	};
	const messages = await sendWebhook(targetChannel, webhookOptions);
	return messages ?? [];
}