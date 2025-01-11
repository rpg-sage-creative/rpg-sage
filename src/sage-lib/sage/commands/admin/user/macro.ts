import { unwrap, wrap } from "@rsc-utils/string-utils";
import { registerListeners } from "../../../../discord/handlers/registerListeners.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { SageCommand } from "../../../model/SageCommand.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import { isValidTable } from "../../dice/isValidTable.js";
import { createCustomIdRegExp } from "../macro/customId.js";
import { getArgPairs } from "../macro/getArgs.js";
import { getMacroType } from "../macro/getMacroType.js";
import { handleMacroButton } from "../macro/handleMacroButton.js";
import { handleMacroModal } from "../macro/handleMacroModal.js";
import { HasMacros, type Macro } from "../macro/HasMacros.js";
import { macroToPrompt } from "../macro/macroToPrompt.js";
import { mCmdDetails } from "../macro/mCmdDetails.js";
import { mCmdList, mSelectCategory, mSelectMacroPage } from "../macro/mCmdList.js";

async function macroCreate(sageMessage: SageMessage, macro: Macro): Promise<boolean> {
	const macroPrompt = macroToPrompt(sageMessage, macro, { usage:true });

	const promptRenderable = sageMessage.createAdminRenderable("CREATE_MACRO_?");
	promptRenderable.append(macroPrompt);

	const bool = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (bool === true) {
		return sageMessage.sageUser.macros.pushAndSave(macro);
	}
	return false;
}

async function promptMacroUpdate(sageCommand: SageCommand, existing: Macro, updated: Macro): Promise<boolean> {
	const existingPrompt = macroToPrompt(sageCommand, existing);
	const updatedPrompt = macroToPrompt(sageCommand, updated, { usage:true });

	const promptRenderable = sageCommand.createAdminRenderable("UPDATE_MACRO_?");
	const localize = sageCommand.getLocalizer();
	promptRenderable.append(`${localize("FROM")}:${existingPrompt}\n${localize("TO")}:${updatedPrompt}`);

	const bool = await discordPromptYesNo(sageCommand, promptRenderable, true);
	if (bool === true) {
		existing.category = updated.category ?? existing.category;
		existing.dice = updated.dice;
		return sageCommand.sageUser.save();
	}
	return false;
}

async function macroSet(sageMessage: SageMessage): Promise<void> {
	const localize = sageMessage.getLocalizer();

	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
		return sageMessage.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	const { namePair, categoryPair, contentPair } = getArgPairs(sageMessage);

	// check the table value specifically to ensure we have a valid table before saving the macro
	if (contentPair?.key === "table") {
		const tableValue = unwrap(contentPair.value ?? "", "[]");

		// check for a valid table
		const isValid = await isValidTable(tableValue);
		if (!isValid) {
			return sageMessage.replyStack.whisper(localize("INVALID_TABLE_DATA"));
		}

		// wrap the value to pass the following diceMatch test (requires being wrapped in [])
		contentPair.value = wrap(tableValue, "[]");
	}

	const content = sageMessage.message.content ?? "";
	const diceMatch = (contentPair?.value ?? content).match(/\[[^\]]+\]/ig);
	if (!diceMatch) {
		return sageMessage.reactFailure();
	}

	const macroCategory = categoryPair?.value ?? undefined;
	const macroDice = diceMatch.join("");
	const macroName = namePair?.value ?? content.replace(macroDice, "").trim();
	if (!macroName) {
		return sageMessage.reactFailure();
	}

	let saved = false;
	const oldMacro = HasMacros.from(sageMessage.sageUser).find({ name:macroName });
	const newMacro = {
		category: macroCategory,
		name: macroName,
		dice: macroDice,
		ownerId: sageMessage.actorId,
		ownerType: "user" as "user",
		type: getMacroType(macroDice)
	};
	if (oldMacro) {
		saved = await promptMacroUpdate(sageMessage, oldMacro, newMacro);
	} else {
		saved = await macroCreate(sageMessage, newMacro);
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function macroMove(sageMessage: SageMessage): Promise<void> {
	const localize = sageMessage.getLocalizer();

	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
		return sageMessage.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	const { categoryPair, namePair } = getArgPairs(sageMessage);
	const macroName = namePair?.value;
	if (!macroName || !categoryPair) {
		return sageMessage.reactFailure();
	}

	let saved = false;
	const existing = HasMacros.from(sageMessage.sageUser).find({ name:macroName });
	if (existing) {
		const existingPrompt = macroToPrompt(sageMessage, existing);
		const updatedPrompt = macroToPrompt(sageMessage, { ...existing, category:categoryPair.value });

		const promptRenderable = sageMessage.createAdminRenderable("UPDATE_MACRO_?");
		promptRenderable.append(`${localize("FROM")}:${existingPrompt}\n${localize("TO")}:${updatedPrompt}`);

		const bool = await discordPromptYesNo(sageMessage, promptRenderable, true);
		if (bool === true) {
			existing.category = categoryPair.value ?? existing.category;
			saved = await sageMessage.sageUser.save();
		}
	}
	return sageMessage.reactSuccessOrFailure(saved);
}

async function macroDeleteAll(sageMessage: SageMessage): Promise<void> {
	const localize = sageMessage.getLocalizer();

	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
		return sageMessage.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
	}

	const count = sageMessage.sageUser.macros.length;
	const promptRenderable = sageMessage.createAdminRenderable("DELETE_ALL_X_MACROS_?", count);
	const yes = await discordPromptYesNo(sageMessage, promptRenderable, true);
	if (yes === true) {
		const saved = await sageMessage.sageUser.macros.emptyAndSave();
		return sageMessage.reactSuccessOrFailure(saved);
	}
	return Promise.resolve();
}

export function registerMacro(): void {

	registerListeners({ commands:["macros", "macro|list"], message:mCmdList });
	registerListeners({ commands:[createCustomIdRegExp("selectCategoryPage", "selectCategory")], interaction:mSelectCategory });
	registerListeners({ commands:[createCustomIdRegExp("selectMacroPage")], interaction:mSelectMacroPage });

	registerListeners({ commands:["macro|details", createCustomIdRegExp("selectMacro")], message:mCmdDetails, interaction:mCmdDetails });

	registerListeners({ commands:["macro|add", "macro|create", "macro|set"], message:macroSet });
	registerListeners({ commands:["macro|move"], message:macroMove });
	registerListeners({ commands:["macro|delete|all"], message:macroDeleteAll });
	// registerListeners({ commands:["macro|delete|category"], message:macroDeleteCategory });

	registerListeners({ commands:[createCustomIdRegExp(
		"promptDeleteMacro",
		"confirmDeleteMacro",
		"cancelDeleteMacro",

		"showEditMacro",
		"confirmEditMacro",
		"cancelEditMacro",

		"showNewMacro",
	)], interaction:handleMacroButton });

	registerListeners({ commands:[createCustomIdRegExp("promptEditMacro")], interaction:handleMacroModal });
}
