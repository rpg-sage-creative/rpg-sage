import type { SlashCommand } from "../../types.js";

export function registerCommand(): SlashCommand {
	return {
		name: "Import",
		description: "Import a character to Sage",
		children: [
			{
				name:"Pathbuilder-2e",
				description: "Import from Pathbuilder 2e using 'Export to JSON'",
				options: [
					{ name:"id", description:"'Export to JSON' id", isNumber:true, isRequired:true },
					{ name:"attach", description:"Attach as a Markdown formatted .txt", isBoolean:true },
					{ name:"pin", description:"Pin character", isBoolean:true },
				]
			},
			{
				name:"Starfinder-2e",
				description: "Import a Starfinder 2e character from PDF",
				options: [
					{ name:"pdf", description:"URL to pdf or Message with PDF attached", isRequired:true },
					{ name:"attach", description:"Attach as a Markdown formatted .txt", isBoolean:true },
					{ name:"pin", description:"Pin character", isBoolean:true },
				]
			},
			{
				name:"Essence20-pdf",
				description: "Import an Essence20 character from PDF",
				options: [
					{ name:"pdf", description:"URL to pdf or Message with PDF attached", isRequired:true },
					{ name:"attach", description:"Attach as a Markdown formatted .txt", isBoolean:true },
					{ name:"pin", description:"Pin character", isBoolean:true },
				]
			},
		],
	};
}