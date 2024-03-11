
import { error } from "@rsc-utils/console-utils";
import { filterFiles } from "@rsc-utils/fs-utils";
import type { SlashCommand } from "../types.js";

type CommandType = SlashCommand;
type CommandImport = { registerCommand:() => CommandType; }
type Commands = {
	message: SlashCommand[];
	slash: SlashCommand[];
	user: SlashCommand[];
};

export async function registerCommands(): Promise<Commands> {
	const commands: Commands = { message:[], slash:[], user:[] };
	try {
		const commandPaths = await filterFiles("./app-commands/commands", fileName => fileName.endsWith(".js") && fileName !== "registerCommands.js", true);
		for (const commandPath of commandPaths) {
			const { registerCommand } = await import(commandPath.replace("./app-commands/commands", ".")) as CommandImport;
			if (commandPath.includes("/message/")) {
				commands.message.push(registerCommand());
			}else if (commandPath.includes("/user/")) {
				commands.user.push(registerCommand());
			}else {
				commands.slash.push(registerCommand());
			}
		}
	}catch(ex) {
		error(ex);
	}
	return commands;
}