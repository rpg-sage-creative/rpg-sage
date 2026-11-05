import { wipeSlashCommands } from "@rsc-chat/discord-utils";
import { getCodeName, getDataRoot, getToken } from "@rsc-sage/env";
import { findJsonFile } from "@rsc-utils/io-utils";
import { captureProcessExit, Logger } from "@rsc-utils/logger-utils";

captureProcessExit();

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
		Logger.package("@rsc-apps/command").error("Unable to find Bot: %s", codeName);

	}else {
		// remove all slash commands for the bot
		wipeSlashCommands({ appId:botCore.id, appToken:getToken(), codeName });
	}
}

// make sure we don't trigger this with an index.ts include
if (process.argv[1].endsWith("wipe.mjs")) {
	main();
}
