import { registerSlashCommand } from "../../../../slash.mjs";
import type { TSlashCommand } from "../../../../SlashTypes";

function dateCommand(): TSlashCommand {
	return {
		name: "Date",
		description: "Show today (or a specific day) for PF/SF Games",
		options: [
			{ name:"date", description:"A specific date: yyy-mm-dd" },
			{ name:"origin", description:"Where does the year originate?", choices:["Absalom", "Earth", "Golarion"] }
		]
	};
}
function calendarCommand(): TSlashCommand {
	return {
		name: "Calendar",
		description: "Calendar days/months for PF/SF Games"
	};
}
function calCommands(): TSlashCommand[] {
	return [
		dateCommand(),
		calendarCommand()
	];
}

export function registerCalSlashCommands(): void {
	registerSlashCommand("Finder", ...calCommands());
}
