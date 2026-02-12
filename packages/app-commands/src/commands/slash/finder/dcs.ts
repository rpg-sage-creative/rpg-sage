import type { SlashCommand } from "../../../index.js";

export function registerCommand(): SlashCommand {
	return {
		game: "PF2E",
		name: "DCs",
		description: "Show Difficulty Classes",
		options: [
			{ name:"table", description:"Which DCs?", choices:[
				{ name:"Simple", value:"simple" },
				{ name:"By Level", value:"level" },
				{ name:"By Spell Level", value:"spell" }
			], isRequired:true },
			{ name:"proficiency", description:"What Proficiency?", choices:[
				["Untrained", "U"],
				["Trained", "T"],
				["Expert", "E"],
				["Master", "M"],
				["Legendary", "L"],
			] },
			{ name:"level", description:"Which Level?", isNumber:true }
		]
	};
}