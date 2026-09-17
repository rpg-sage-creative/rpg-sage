import { ContextMenuCommandBuilder } from "@discordjs/builders";
import type { UserCommand } from "../index.js";

export function buildUser(all: UserCommand[]): ContextMenuCommandBuilder[] {
	return all.map(cmd =>
		new ContextMenuCommandBuilder()
			.setType(cmd.type)
			.setName(cmd.name)
	);
}