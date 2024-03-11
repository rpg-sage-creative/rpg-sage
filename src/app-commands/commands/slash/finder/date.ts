import type { SlashCommand } from "../../../types.js";

export function registerCommand(): SlashCommand {
	return {
		game: "Finder",
		name: "Date",
		description: "Show today (or a specific day) for PF/SF Games",
		options: [
			{ name:"date", description:"A specific date: yyyy-mm-dd" },
			{ name:"origin", description:"Where does the year originate?", choices:["Absalom", "Earth", "Golarion"] }
		]
	};
}