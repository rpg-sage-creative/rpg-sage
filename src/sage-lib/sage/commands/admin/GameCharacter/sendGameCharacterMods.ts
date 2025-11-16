import { partition, sortPrimitive, StringSet } from "@rsc-utils/core-utils";
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

	const isD20 = character.gameSystem?.code === "D20";
	const is5e = character.gameSystem?.code === "DnD5e";
	const isP20 = character.gameSystem?.isP20;

	let showConditions = false;
	let showCurrency = false;

	const sortedKeys = [...updatedKeys].sort(sortPrimitive);
	const [statKeys, templateKeys] = partition(sortedKeys, key =>
		key.toLowerCase().endsWith(".template") ? 1 : 0
	);

	if (statKeys?.length) {
		renderableContent.appendTitledSection(`<b>Stats Updated</b>`);

		statKeys.forEach(key => {
			const keyLower = key.toLowerCase();

			const currencyType = isP20 ? ["cp","sp","gp","pp","credits","upb"].includes(keyLower)
				: isD20 ? ["cp","sp","gp","pp"].includes(keyLower)
				: is5e ? ["cp","sp","ep","gp","pp"].includes(keyLower)
				: false;
			if (currencyType) {
				showCurrency = true;
			}

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
					const trackerBar = character.hasTrackerBar(key) ? character.getTrackerBar(key) : "";
					const trackerDots = character.hasTrackerDots(key) ? character.getTrackerDots(key) : "";
					const trackerMeter = character.hasIndexedValues(key) ? character.getString(`${key}.indexed`) : "";
					renderableContent.append(`<b>${key}</b> ${value} ${trackerBar}${trackerDots}${trackerMeter}`.trim());
				}

			}else {
				renderableContent.append(`<s><b>${key}</b></s>`);
			}
		});
	}

	if (templateKeys?.length) {
		renderableContent.appendTitledSection(`<b>Templates Updated</b>`);

		templateKeys.forEach(key => {
			const value = character.getString(key);
			if (value) {
				renderableContent.append(`<b>${key}</b>\`\`\`${value}\`\`\``);
			}else {
				renderableContent.append(`<s><b>${key}</b></s>`);
			}
		});
	}

	if (showCurrency) {
		const currency = character.getString("currency");
		const currencyRaw = character.getString("currency.raw");
		if (currency !== currencyRaw) {
			renderableContent.appendTitledSection(`<b>Updated Currency</b>`, `${currencyRaw}  <i>(${currency})</i>`);
		}else {
			renderableContent.appendTitledSection(`<b>Updated Currency</b>`, `${currency}`);
		}
	}

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