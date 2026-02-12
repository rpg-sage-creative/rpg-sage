import { error, getCodeName, getDataRoot, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { findJsonFile } from "@rsc-utils/io-utils";
import { updateSlashCommands } from "./rest/updateSlashCommands.js";
import type { BotCore } from "./types/BotCore.js";

initializeConsoleUtilsByEnvironment();

// const ContextMenuCommandTypeMessage = 3;
// function buildMapContextMenuCommandBuilder(): ContextMenuCommandBuilder {
// 	return new ContextMenuCommandBuilder()
// 		.setName("Add Image")
// 		.setType(ContextMenuCommandTypeMessage)
// 		;
// }

async function main() {
	const codeName = getCodeName();
	const botCore = await findJsonFile(getDataRoot("sage/bots"), { contentFilter:(core: BotCore) => core.codeName === codeName });

	if (!botCore) {
		error(`Unable to find Bot: ${codeName}`);

	}else {
		// build and update all slash commands for the bot
		updateSlashCommands(botCore);
	}
}
main();
