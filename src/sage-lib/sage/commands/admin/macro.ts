import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import { createCustomIdRegExp } from "./macro/customId.js";
import { handleMacroInteraction, handleSetMacro } from "./macro/handleMacroInteraction.js";
import { mCmdDetails } from "./macro/mCmdDetails.js";
import { handleSelection, mCmdList } from "./macro/mCmdList.js";

// async function macroMove(sageMessage: SageMessage): Promise<void> {
// 	const localize = sageMessage.getLocalizer();

// 	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
// 		return sageMessage.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
// 	}

// 	const { categoryPair, namePair } = getArgPairs(sageMessage);
// 	const macroName = namePair?.value;
// 	if (!macroName || !categoryPair) {
// 		return sageMessage.reactFailure();
// 	}

// 	let saved = false;
// 	const existing = HasMacros.from(sageMessage.sageUser).find({ name:macroName });
// 	if (existing) {
// 		const existingPrompt = macroToPrompt(sageMessage, existing);
// 		const updatedPrompt = macroToPrompt(sageMessage, { ...existing, category:categoryPair.value });

// 		const promptRenderable = sageMessage.createAdminRenderable("UPDATE_MACRO_?");
// 		promptRenderable.append(`${localize("FROM")}:${existingPrompt}\n${localize("TO")}:${updatedPrompt}`);

// 		const bool = await discordPromptYesNo(sageMessage, promptRenderable, true);
// 		if (bool === true) {
// 			existing.category = categoryPair.value ?? existing.category;
// 			saved = await sageMessage.sageUser.save();
// 		}
// 	}
// 	return sageMessage.reactSuccessOrFailure(saved);
// }

// async function macroDeleteAll(sageMessage: SageMessage): Promise<void> {
// 	const localize = sageMessage.getLocalizer();

// 	if (!sageMessage.allowCommand && !sageMessage.allowDice) {
// 		return sageMessage.replyStack.whisper(localize("CANNOT_MANAGE_MACRO_HERE"));
// 	}

// 	const count = sageMessage.sageUser.macros.length;
// 	const promptRenderable = sageMessage.createAdminRenderable("DELETE_ALL_X_MACROS_?", count);
// 	const yes = await discordPromptYesNo(sageMessage, promptRenderable, true);
// 	if (yes === true) {
// 		const saved = await sageMessage.sageUser.macros.emptyAndSave();
// 		return sageMessage.reactSuccessOrFailure(saved);
// 	}
// 	return Promise.resolve();
// }

export function registerMacro(): void {

	registerListeners({ commands:["macros", "macro|list"], message:mCmdList });
	registerListeners({ commands:["macro|details"], message:mCmdDetails });
	registerListeners({ commands:["macro|set"], message:handleSetMacro });

	registerListeners({ commands:[createCustomIdRegExp(
		"selectOwnerType",
		"selectOwnerPage",
		"selectOwnerId",

		"selectCategoryPage",
		"selectCategory",

		"selectMacroPage",
		"selectMacro"
	)], interaction:handleSelection });

	registerListeners({ commands:[createCustomIdRegExp(
		"rollMacro",
		"showMacroArgs",
		"rollMacroArgs",

		"promptDeleteMacro",
		"confirmDeleteMacro",
		"cancelDeleteMacro",

		"promptDeleteAll",
		"confirmDeleteAll",
		"cancelDeleteAll",

		"showEditMacroModal",
		"handleEditMacroModal",
		"confirmEditMacro",
		"cancelEditMacro",

		"showNewMacroModal",
		"handleNewMacroModal",
		"confirmNewMacro",
		"cancelNewMacro",

		"showRollButtons",
		"showEditButtons",
		"showOtherButtons",

		"resetControl"
	)], interaction:handleMacroInteraction });
}
