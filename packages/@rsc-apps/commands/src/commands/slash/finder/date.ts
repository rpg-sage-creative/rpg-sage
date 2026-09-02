import type { GameSlashCommand } from "@rsc-utils/discord-utils";

export function registerCommand(): GameSlashCommand<"Finder"> {
	return {
		game: "Finder",
		name: "Date",
		description: "Show today (or a specific day) for PF/SF Games",
		options: [
			{ name:"date", description:"A specific date: yyyy-mm-dd" },
			{ name:"origin", description:"Where does the year originate?", choices:["Absalom Station", "Earth", "Golarion"] }
		]
	};
}