
import { error } from "@rsc-utils/core-utils";
import { filterFiles } from "@rsc-utils/io-utils";
import { join, parse } from "node:path";
import type { MessageCommand, SlashCommand, UserCommand } from "../index.js";

type CommandType = SlashCommand | MessageCommand | UserCommand;
type CommandImport<T extends CommandType> = { registerCommand:() => T; };
type Commands = {
	message: MessageCommand[];
	slash: SlashCommand[];
	user: UserCommand[];
};

type CommandPathValidator = (commandPath: string) => boolean;

export async function registerCommands(commandPathValidator: CommandPathValidator): Promise<Commands> {
	const commands: Commands = { message:[], slash:[], user:[] };

	const pathRoot = process.argv.find(arg => arg.startsWith("pathRoot=/"))?.slice(9)
		?? join(parse(process.argv[1]!).dir, "commands");

	const filterFileOptions = {
		dirFilter: (_dirName: string, dirPath: string) => commandPathValidator(dirPath),
		fileFilter: (fileName: string) => fileName.endsWith(".js") && fileName !== "registerCommands.js",
		recursive: true
	};

	try {
		const commandPaths = await filterFiles(pathRoot, filterFileOptions);
		for (const commandPath of commandPaths) {
			const { registerCommand } = await import(commandPath) as CommandImport<any>;

			let commandArray = commands.slash;
			if (commandPath.includes("/message/")) {
				commandArray = commands.message;
			}else if (commandPath.includes("/user/")) {
				commandArray = commands.user;
			}

			commandArray.push(registerCommand() as any);
		}
	}catch(ex) {
		error(ex);
	}
	return commands;
}