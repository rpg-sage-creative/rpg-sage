import { registerSlashCommand } from "../../../../slash.mjs";
import type { TSlashCommand } from "../../../../SlashTypes";

function dmCommand(): TSlashCommand {
	return {
		"name": "DM",
		"description": "Establish direct message channel with RPG Sage."
	};
}

export function registerDefaultSlashCommands(): void {
	registerSlashCommand(dmCommand());
}
