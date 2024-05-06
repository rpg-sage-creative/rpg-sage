import type { SlashCommand } from "../../../types.js";

export function registerCommand(): SlashCommand {
	return {
		game: "Finder",
		name: "Calendar",
		description: "Calendar days/months for PF/SF Games"
	};
}