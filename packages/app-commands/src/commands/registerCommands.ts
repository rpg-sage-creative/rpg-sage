
import { error, getCodeName } from "@rsc-utils/core-utils";
import { filterFiles } from "@rsc-utils/io-utils";
import type { MessageCommand, SlashCommand, UserCommand } from "../index.js";

type CommandType = SlashCommand | MessageCommand | UserCommand;
type CommandImport<T extends CommandType> = { registerCommand:() => T; };
type Commands = {
	message: MessageCommand[];
	slash: SlashCommand[];
	user: UserCommand[];
};

export async function registerCommands(): Promise<Commands> {
	const commands: Commands = { message:[], slash:[], user:[] };
	const pathRoot = process.argv.find(arg => arg.startsWith("pathRoot="))?.slice(9) ?? `./build/app-commands/commands`;
	const filterFileOptions = {
		fileFilter: (fileName: string) => fileName.endsWith(".js") && fileName !== "registerCommands.js",
		recursive: true
	};
	try {
		const botCodeName = getCodeName();
		const commandPaths = await filterFiles(pathRoot, filterFileOptions);
		for (const commandPath of commandPaths) {
			const { registerCommand } = await import(commandPath.replace(pathRoot, ".")) as CommandImport<any>;

			let commandArray = commands.slash;
			if (commandPath.includes("/message/")) {
				commandArray = commands.message;
			}else if (commandPath.includes("/user/")) {
				commandArray = commands.user;
			}

			const codeName = /\/(?<codeName>dev|beta|stable)\//.exec(commandPath)?.groups?.codeName;
			if (!codeName || codeName === botCodeName) {
				commandArray.push(registerCommand());
			}

		}
	}catch(ex) {
		error(ex);
	}
	return commands;
}