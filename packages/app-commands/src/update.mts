import { getToken } from "@rsc-sage/env";
import { error, getCodeName, getDataRoot, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { updateSlashCommands } from "@rsc-utils/discord-utils";
import { findJsonFile } from "@rsc-utils/io-utils";
import { commandPathValidator } from "./utils/commandPathValidator.js";

initializeConsoleUtilsByEnvironment();

// const ContextMenuCommandTypeMessage = 3;
// function buildMapContextMenuCommandBuilder(): ContextMenuCommandBuilder {
// 	return new ContextMenuCommandBuilder()
// 		.setName("Add Image")
// 		.setType(ContextMenuCommandTypeMessage)
// 		;
// }

type BotCore = { codeName:string; id:string; };

async function main() {
	const codeName = getCodeName();
	const botCore = await findJsonFile(getDataRoot("sage/bots"), { contentFilter:(core: BotCore) => core.codeName === codeName });

	if (!botCore) {
		error(`Unable to find Bot: ${codeName}`);

	}else {
		// build and update all slash commands for the bot
		updateSlashCommands({ appId:botCore.id, appToken:getToken(), codeName, commandPathValidator });
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("update.mjs")) {
	main();
}
