//#region slash command

import { registerSlashCommand } from "../../../slash.mjs";
import type { TSlashCommand } from "../../../types.js";
import { registerInteractionListener } from "../../discord/handlers.js";
import type { SageInteraction } from "../model/SageInteraction";
import { e20Pdf, slashHandlerEssence20 } from "./e20.js";
import { pb2eId, slashHandlerPathbuilder2e } from "./pathbuilder.js";

// pb2eId=118142
function slashTester(sageInteraction: SageInteraction): boolean {
	if (sageInteraction.isCommand("import")) {
		return sageInteraction.args.hasNumber(pb2eId)
			|| sageInteraction.args.hasString(e20Pdf);
	}
	return false;
}

async function slashHandler(sageInteraction: SageInteraction): Promise<void> {
	if (sageInteraction.args.hasNumber(pb2eId)) {
		return slashHandlerPathbuilder2e(sageInteraction);
	}
	if (sageInteraction.args.hasString(e20Pdf)) {
		return slashHandlerEssence20(sageInteraction);
	}
	return sageInteraction.reply(`Sorry, unable to import your character at this time.`, true);
}


function importCommand(): TSlashCommand {
	return {
		name: "Import",
		description: "Import a character to Sage",
		options: [
			{ name:e20Pdf, description:"Import an Essence20 character from PDF" },
			{ name:pb2eId, description:"Import from Pathbuilder 2e using 'Export to JSON'", isNumber:true },
			{ name:"attach", description:"Attach as a Markdown formatted .txt", isBoolean:true },
			{ name:"pin", description:"Pin character", isBoolean:true }
		]
	};
}

export function registerCommandHandlers(): void {
	registerInteractionListener(slashTester, slashHandler);
}

export function registerSlashCommands(): void {
	registerSlashCommand(importCommand());
}

