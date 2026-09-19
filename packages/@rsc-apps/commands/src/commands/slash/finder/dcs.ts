import type { GameSlashCommand } from "@rsc-utils/discord-utils";

export function registerCommand(): GameSlashCommand<"Finder"> {
	return {
		game: "Finder",
		name: "DCs",
		description: "Show Difficulty Classes",
		options: [
			{ name:"table", description:"Which DCs?", choices:[
				{ name:"Simple", value:"simple" },
				{ name:"By Level", value:"level" },
				{ name:"By Spell Rank", value:"spell" }
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