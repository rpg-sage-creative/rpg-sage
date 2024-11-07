import { isDefined, type Snowflake } from "@rsc-utils/core-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { createAdminRenderableContent } from "../../cmd.js";
import { addPostCurrencyEvent, removePostCurrency, renderPostCurrency } from "../PostCurrency.js";

async function gCmdAddCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	if (!sageCommand.canAdminGame) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to manage this Game.");
	}

	const key = sageCommand.args.getString("key");
	const dialogIncrement = sageCommand.args.getNumber("dialogIncrement") ?? sageCommand.args.getNumber("increment") ?? undefined;
	const diceIncrement = sageCommand.args.getNumber("diceIncrement") ?? undefined;
	if (!key || !(isDefined(dialogIncrement) || isDefined(diceIncrement))) {
		return sageCommand.replyStack.whisper(`Your command must include key="" and either dialogIncrement="" or diceIncrement="".`);
	}

	const name = sageCommand.args.getString("name");
	const description = sageCommand.args.getString("description") ?? sageCommand.args.getString("desc");
	const resetCounts = sageCommand.args.getBoolean("resetCounts") ?? false;
	const recalculateTotals = sageCommand.args.getBoolean("recalculateTotals") ?? false;

	addPostCurrencyEvent(sageCommand.game, { key, name, description, dialogIncrement, diceIncrement, resetCounts, recalculateTotals })

	sageCommand.replyStack.stopThinking();

	await _gCmdShowCurrency(sageCommand);

	const displayName = name ?? key;

	const save = await discordPromptYesNo(sageCommand, `Save Post Currency "${displayName}"?`, true);
	if (save) {
		const saved = await sageCommand.game.save();
		if (saved) {
			await sageCommand.replyStack.editLast(`Post Currency "${displayName}" Saved.`);

		}else {
			await sageCommand.replyStack.whisper(`Unknown Error; Post Currency "${displayName}" NOT Saved!`);

		}
	}else {
		await sageCommand.replyStack.editLast(`Post Currency "${displayName}" ***NOT*** Saved.`);

	}
}

async function gCmdRemoveCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	if (!sageCommand.canAdminGame) {
		return sageCommand.replyStack.whisper("Sorry, you aren't allowed to manage this Game.");
	}

	const key = sageCommand.args.getString("key");
	if (!key) {
		return sageCommand.replyStack.whisper(`Your command must include key="".`);
	}

	const currency = sageCommand.game.postCurrency[key];
	if (!currency) {
		return sageCommand.replyStack.whisper(`Post Currency "${key}" not found!`);
	}

	sageCommand.replyStack.stopThinking();

	await _gCmdShowCurrency(sageCommand);

	const displayName = currency.name ?? currency.key;

	const save = await discordPromptYesNo(sageCommand, `Remove Post Currency: ${displayName}?\n> *NOTE: Post counts and totals will be lost. This cannot be undone!*`, true);
	if (save) {
		removePostCurrency(sageCommand.game, { key });
		const saved = await sageCommand.game.save();
		if (saved) {
			await sageCommand.replyStack.editLast(`Post Currency "${displayName}" removed.`);

		}else {
			await sageCommand.replyStack.whisper(`Unknown Error; Post Currency "${displayName}" NOT removed!`);

		}
	}else {
		await sageCommand.replyStack.editLast(`Post Currency "${displayName}" ***NOT*** removed.`);

	}
}

async function gCmdShowCurrency(sageCommand: SageCommand): Promise<void> {
	sageCommand.replyStack.startThinking();

	if (!sageCommand.game) {
		return sageCommand.replyStack.whisper("There is no Game!");
	}

	await _gCmdShowCurrency(sageCommand);

	sageCommand.replyStack.stopThinking();
}

async function _gCmdShowCurrency(sageCommand: SageCommand): Promise<void> {
	const game = sageCommand.game!;

	const renderableContent = createAdminRenderableContent(game);

	const playerGuildMembers = await game.pGuildMembers();
	const players = playerGuildMembers.map(pGuildMember => {
		return {
			userId: pGuildMember.id as Snowflake,
			name: toHumanReadable(pGuildMember)
		};
	});
	renderPostCurrency(game, renderableContent, players);

	await sageCommand.replyStack.send({ embeds:renderableContent });
}

export function registerPostCurrency(): void {
	registerListeners({ commands:["currency|add"], message:gCmdAddCurrency });
	registerListeners({ commands:["currency|remove"], message:gCmdRemoveCurrency });
	registerListeners({ commands:["currency|details"], message:gCmdShowCurrency });
}