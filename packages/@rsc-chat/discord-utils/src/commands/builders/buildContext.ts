import { ContextMenuCommandBuilder } from "@discordjs/builders";
import type { ContextCommand } from "../index.js";

export function buildContext(all: ContextCommand[]): ContextMenuCommandBuilder[] {
	return all.map(cmd =>
		new ContextMenuCommandBuilder()
			.setType(cmd.type)
			.setName(cmd.name)
	);
}