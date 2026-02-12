import type { SlashCommand } from "../../index.js";

export function registerCommand(): SlashCommand {
	return {
		name: "Help",
		description: "Get basic Help for RPG Sage."
	};
}