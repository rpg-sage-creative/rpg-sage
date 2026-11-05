import type { SlashCommand } from "@rsc-chat/discord-utils";

export function registerCommand(): SlashCommand {
	return {
		name: "Help",
		description: "Get basic Help for RPG Sage."
	};
}