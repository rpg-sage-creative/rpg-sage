import type { SlashCommand } from "../../types.js";

export function registerCommand(): SlashCommand {
	return {
		name: "DM",
		description: "Establish direct message channel with RPG Sage."
	};
}