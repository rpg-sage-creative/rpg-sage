import { error, getCodeName, getDataRoot, info, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { findJsonFile, writeFileSync } from "@rsc-utils/io-utils";
import { buildCommands } from "./app-commands/builders/buildCommands.js";
import { countCharacters } from "./app-commands/builders/countCharacters.js";
import { updateSlashCommands } from "./app-commands/rest/updateSlashCommands.js";
import { wipeSlashCommands } from "./app-commands/rest/wipeSlashCommands.js";
import type { BotCore } from "./app-commands/types.js";

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
		if (process.argv.includes("update")) {
			// build and update all slash commands for the bot
			updateSlashCommands(botCore);

		}else if (process.argv.includes("wipe")) {
			// remove all slash commands for the bot
			wipeSlashCommands(botCore);

		}else {
			// build all slash commands for the bot and save the json
			try {
				const built = await buildCommands();
				writeFileSync(`../data/slash/${codeName}.json`, built, true, true);
				const characterCount = await countCharacters();
				info(`Slash Commands built for ${codeName}: ${built.length} commands; ${characterCount} characters`);
			}catch(ex) {
				error(ex);
			}
		}
	}
}
main();
