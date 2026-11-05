import type { SlashCommand } from "@rsc-chat/discord-utils";

export function registerCommand(): SlashCommand {
	return {
		name: "DM",
		description: "Establish direct message channel with RPG Sage."
	};
}