import { registerSlashCommand } from "../../../../slash.mjs";
import type { TSlashCommand } from "../../../../SlashTypes.js";
import { e20Pdf } from "../e20.js";
import { pb2eId } from "../pathbuilder.js";


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


export function registerImportSlashCommands(): void {
	registerSlashCommand(importCommand());
}

