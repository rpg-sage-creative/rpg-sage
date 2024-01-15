import { registerSlashCommand } from "../../../../slash.mjs";
import type { TSlashCommand } from "../../../../SlashTypes";

function dcCommand(): TSlashCommand {
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

export function registerDcsSlashCommands(): void {
	registerSlashCommand("PF2E", dcCommand());
}
