import type { SlashCommand } from "../../types.js";

const e20Pdf = "e20-pdf";
const pb2eId = "pathbuilder2e-id";

export function registerCommand(): SlashCommand {
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