import type { ContextMenuCommandBuilder } from "@discordjs/builders";
import type { SlashCommand } from "../types";

export function buildContext(_raw: SlashCommand): ContextMenuCommandBuilder[] {
	const commands: ContextMenuCommandBuilder[] = [];
	return commands;
}