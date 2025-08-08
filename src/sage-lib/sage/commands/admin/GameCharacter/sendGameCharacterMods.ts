import { sortPrimitive, StringSet } from "@rsc-utils/core-utils";
import type { Message } from "discord.js";
import { Condition } from "../../../../../gameSystems/p20/lib/Condition.js";
import { sendWebhook } from "../../../../discord/messages.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { createAdminRenderableContent } from "../../cmd.js";

export async function sendGameCharacterMods(sageMessage: SageMessage, character: GameCharacter, updatedKeys: StringSet): Promise<Message[]> {
	const renderableContent = createAdminRenderableContent(sageMessage.getHasColors(), character.name);

	if (character.embedColor) {
		renderableContent.setColor(character.embedColor);
	}
	if (character.avatarUrl) {
		renderableContent.setThumbnailUrl(character.avatarUrl);
	}

	renderableContent.appendTitledSection(`<b>Stats Updated</b>`);

	const isP20 = character.gameSystem?.isP20;

	let showConditions = false;
	const sortedKeys = [...updatedKeys].sort(sortPrimitive);
	sortedKeys.forEach(key => {
		// check if we are dealing with a isP20 condition
		const conditionType = isP20 ? Condition.isConditionKey(key) : false;
		if (conditionType) {
			showConditions = true;
		}

		const value = character.getString(key);
		if (value) {
			if (conditionType === "toggled") {
				// toggled conditions don't need to show their "on" value
				renderableContent.append(`<b>${key}</b>`);
			}else {
				renderableContent.append(`<b>${key}</b> ${value}`);
			}

		}else {
			renderableContent.append(`<s><b>${key}</b></s>`);
		}
	});

	if (showConditions) {
		const conditions = character.getString("conditions")?.split(/\s*,\s*/).filter(s => s) ?? [];
		const conditionsString = conditions.length ? conditions.join(", ") : `<i>no conditions</i>`;
		renderableContent.appendTitledSection(`<b>Updated Conditions</b>`, conditionsString);
	}

	const targetChannel = sageMessage.message.channel;
	const avatarUrl = character.tokenUrl ?? sageMessage.bot.tokenUrl;

	const { sageCache } = sageMessage;
	const authorOptions = { avatarURL: avatarUrl, username: character.toDisplayName() };
	const dialogType = sageMessage.dialogPostType;
	const messages = await sendWebhook(targetChannel, { authorOptions, dialogType, renderableContent, sageCache });
	return messages ?? [];
}