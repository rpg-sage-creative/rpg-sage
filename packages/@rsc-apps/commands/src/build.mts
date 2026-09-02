import { error, getCodeName, getDataRoot, info, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { buildAndCount } from "@rsc-utils/discord-utils";
import { findJsonFile, writeFileSync } from "@rsc-utils/io-utils";
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
	const botsPath = getDataRoot(["sage", "bots"]);
	const botCore = await findJsonFile(botsPath, { contentFilter:(core: BotCore) => core.codeName === codeName });

	if (!botCore) {
		error(`Unable to find Bot: ${codeName}`);

	}else {
		// build all slash commands for the bot and save the json
		try {
			const { builders, characterCount } = await buildAndCount(commandPathValidator);
			writeFileSync(`./data/slash/${codeName}.json`, builders, { makeDir:true, formatted:true });
			info(`Slash Commands built for ${codeName}: ${builders.length} commands; ${characterCount} characters`);
		}catch(ex) {
			error(ex);
		}

	}
}
main();
