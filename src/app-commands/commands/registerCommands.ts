
import { error } from "@rsc-utils/core-utils";
import { filterFiles } from "@rsc-utils/io-utils";
import type { MessageCommand, SlashCommand, UserCommand } from "../types.js";

type CommandType = SlashCommand | MessageCommand | UserCommand;
type CommandImport<T extends CommandType> = { registerCommand:() => T; };
type Commands = {
	message: MessageCommand[];
	slash: SlashCommand[];
	user: UserCommand[];
};

export async function registerCommands(): Promise<Commands> {
	const commands: Commands = { message:[], slash:[], user:[] };
	try {
		const commandPaths = await filterFiles("./app-commands/commands", fileName => fileName.endsWith(".js") && fileName !== "registerCommands.js", true);
		for (const commandPath of commandPaths) {
			const { registerCommand } = await import(commandPath.replace("./app-commands/commands", ".")) as CommandImport<any>;
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