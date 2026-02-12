import { registerCommands } from "../commands/registerCommands.js";
import type { SlashCommand } from "../index.js";

export async function countCharacters(): Promise<number> {
	let count = 0;

	const commands = await registerCommands();
	const keys = Object.keys(commands) as (keyof typeof commands)[];
	keys.forEach(type => {
		commands[type].forEach(command => {
			count += doCount(command);
		});
	});

	function doCount(cmd: SlashCommand): number {
		let count = 0;
		count += cmd.name.length;
		count += cmd.description?.length ?? 0;
		cmd.children?.forEach(child => count += doCount(child));
		cmd.options?.forEach(option => count += doCount(option));
		return count;
	}

	return count;
}