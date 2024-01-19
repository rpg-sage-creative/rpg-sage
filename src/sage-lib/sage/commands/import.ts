import { registerInteractionListener } from "../../discord/handlers.js";
import type { SageInteraction } from "../model/SageInteraction";
import { e20Pdf, slashHandlerEssence20 } from "./e20.js";
import { pb2eId, slashHandlerPathbuilder2e } from "./pathbuilder.js";

// pb2eId=118142
function slashTester(sageInteraction: SageInteraction): boolean {
	if (sageInteraction.isCommand("import")) {
		return sageInteraction.hasNumber(pb2eId)
			|| sageInteraction.hasString(e20Pdf);
	}
	return false;
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.hasNumber(pb2eId)) {
		return slashHandlerPathbuilder2e(sageInteraction);
	}
	if (sageInteraction.hasString(e20Pdf)) {
		return slashHandlerEssence20(sageInteraction);
	}
	return sageInteraction.reply(`Sorry, unable to import your character at this time.`, true);
}

export function registerImport(): void {
	registerInteractionListener(slashTester, slashHandler);
}
