import { getToken } from "@rsc-sage/env";
import { error, getCodeName, getDataRoot, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { wipeSlashCommands } from "@rsc-utils/discord-utils";
import { findJsonFile } from "@rsc-utils/io-utils";

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
	const botsPath = getDataRoot(["sage", "bots"]);
	const botCore = await findJsonFile(botsPath, { contentFilter:(core: BotCore) => core.codeName === codeName });

	if (!botCore) {
		error(`Unable to find Bot: ${codeName}`);

	}else {
		// remove all slash commands for the bot
		wipeSlashCommands({ appId:botCore.id, appToken:getToken(), codeName });
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("wipe.mjs")) {
	main();
}
