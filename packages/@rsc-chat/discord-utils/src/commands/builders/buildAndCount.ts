import type { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { registerCommands } from "../registerCommands.js";
import { buildContext } from "./buildContext.js";
import { buildSlash } from "./buildSlash.js";
import type { SlashCommand } from "../types.js";

type BuilderType = SlashCommandBuilder | ContextMenuCommandBuilder;
type CommandPathValidator = (commandPath: string) => boolean;

function doCount(cmd: SlashCommand): number {
	let count = 0;
	count += cmd.name.length;
	count += cmd.description?.length ?? 0;
	cmd.children?.forEach(child => count += doCount(child));
	cmd.options?.forEach(option => count += doCount(option));
	return count;
}

export async function buildAndCount(commandPathValidator: CommandPathValidator) {
	const builders: BuilderType[] = [];
	let characterCount = 0;

	const commands = await registerCommands(commandPathValidator);

	builders.push(...buildSlash(commands.slash));
	commands.slash.forEach(command => characterCount += doCount(command));

	builders.push(...buildContext(commands.message));
	commands.message.forEach(command => characterCount += doCount(command));

	builders.push(...buildContext(commands.user));
	commands.user.forEach(command => characterCount += doCount(command));

	return { builders, characterCount };
}