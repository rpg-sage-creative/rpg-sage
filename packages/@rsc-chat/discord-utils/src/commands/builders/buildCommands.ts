import type { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { registerCommands } from "../registerCommands.js";
import { buildContext } from "./buildContext.js";
import { buildSlash } from "./buildSlash.js";

type BuilderType = SlashCommandBuilder | ContextMenuCommandBuilder;
type CommandPathValidator = (commandPath: string) => boolean;

export async function buildCommands(commandPathValidator: CommandPathValidator): Promise<BuilderType[]> {
	const builders: BuilderType[] = [];
	const commands = await registerCommands(commandPathValidator);
	builders.push(...buildSlash(commands.slash));
	builders.push(...buildContext(commands.message));
	builders.push(...buildContext(commands.user));
	return builders;
}