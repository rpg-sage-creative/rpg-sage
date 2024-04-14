import type { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { getBotCodeName } from "@rsc-utils/env-utils";
import { registerCommands } from "../commands/registerCommands.js";
import { buildContext } from "./buildContext.js";
import { buildSlash } from "./buildSlash.js";

type BuilderType = SlashCommandBuilder | ContextMenuCommandBuilder;

export async function buildCommands(): Promise<BuilderType[]> {
	const which = getBotCodeName();
	const commands = await registerCommands();
	commands.slash.forEach(cmd => cmd.name = `sage-${which}-${cmd.name}`);

	const builders: BuilderType[] = [];
	builders.push(...buildSlash(commands.slash));
	builders.push(...buildContext(commands.message));
	builders.push(...buildContext(commands.user));
	return builders;
}