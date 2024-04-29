import type { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { registerCommands } from "../commands/registerCommands.js";
import { buildContext } from "./buildContext.js";
import { buildSlash } from "./buildSlash.js";

type BuilderType = SlashCommandBuilder | ContextMenuCommandBuilder;

export async function buildCommands(): Promise<BuilderType[]> {
	const builders: BuilderType[] = [];
	const commands = await registerCommands();
	builders.push(...buildSlash(commands.slash));
	builders.push(...buildContext(commands.message));
	builders.push(...buildContext(commands.user));
	return builders;
}