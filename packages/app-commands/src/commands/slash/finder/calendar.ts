import type { SlashCommand } from "../../../index.js";

export function registerCommand(): SlashCommand {
	return {
		game: "Finder",
		name: "Calendar",
		description: "Calendar days/months for PF/SF Games"
	};
}