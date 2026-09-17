import { registerCommands } from "../registerCommands.js";
import type { SlashCommand } from "../index.js";

type CommandPathValidator = (commandPath: string) => boolean;

function doCount(cmd: SlashCommand): number {
	let count = 0;
	count += cmd.name.length;
	count += cmd.description?.length ?? 0;
	cmd.children?.forEach(child => count += doCount(child));
	cmd.options?.forEach(option => count += doCount(option));
	return count;
}

/** @deprecated */
export async function countCharacters(commandPathValidator: CommandPathValidator): Promise<number> {
	let count = 0;

	const commands = await registerCommands(commandPathValidator);
	const keys = Object.keys(commands) as (keyof typeof commands)[];
	keys.forEach(type => {
		commands[type].forEach(command => {
			count += doCount(command);
		});
	});

	return count;
}