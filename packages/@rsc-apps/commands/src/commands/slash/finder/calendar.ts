import type { GameSlashCommand } from "@rsc-chat/discord-utils";

export function registerCommand(): GameSlashCommand<"Finder"> {
	return {
		game: "Finder",
		name: "Calendar",
		description: "Calendar days/months for PF/SF Games"
	};
}