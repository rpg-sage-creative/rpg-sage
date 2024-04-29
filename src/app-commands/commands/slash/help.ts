import type { SlashCommand } from "../../types.js";

export function registerCommand(): SlashCommand {
	return {
		name: "Help",
		description: "Get basic Help for RPG Sage."
	};
}