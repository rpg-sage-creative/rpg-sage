import { error, getCodeName, getDataRoot, info, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { findJsonFile, writeFileSync } from "@rsc-utils/io-utils";
import { buildCommands } from "./builders/buildCommands.js";
import { countCharacters } from "./builders/countCharacters.js";
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
		// build all slash commands for the bot and save the json
		try {
			const built = await buildCommands();
			writeFileSync(`./data/slash/${codeName}.json`, built, { makeDir:true, formatted:true });
			const characterCount = await countCharacters();
			info(`Slash Commands built for ${codeName}: ${built.length} commands; ${characterCount} characters`);
		}catch(ex) {
			error(ex);
		}

	}
}
main();
