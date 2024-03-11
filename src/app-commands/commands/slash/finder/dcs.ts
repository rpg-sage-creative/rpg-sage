import type { SlashCommand } from "../../../types.js";

export function registerCommand(): SlashCommand {
	return {
		name: "DCs",
		description: "Show Difficulty Classes",
		options: [
			{ name:"table", description:"Which DCs?", choices:[
				{ name:"Simple", value:"simple" },
				{ name:"By Level", value:"level" },
				{ name:"By Spell Level", value:"spell" }
			], isRequired:true },
			{ name:"proficiency", description:"What Proficiency?", choices:["U","T","E","M","L"] },
			{ name:"level", description:"Which Level?", isNumber:true }
		]
	};
}