import { buildAndCount } from "@rsc-chat/discord-utils";
import { getCodeName, getDataRoot } from "@rsc-sage/env";
import { findJsonFile, writeFileSync } from "@rsc-utils/fs-utils";
import { captureProcessExit, Logger } from "@rsc-utils/logger-utils";
import { commandPathValidator } from "./utils/commandPathValidator.js";

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
		Logger.package("@rsc-apps/commands").error("Unable to find Bot: %s", codeName);

	}else {
		// build all slash commands for the bot and save the json
		try {
			const { builders, characterCount } = await buildAndCount(commandPathValidator);
			writeFileSync(`./data/slash/${codeName}.json`, builders, { makeDir:true, formatted:true });
			Logger.package("@rsc-apps/command").info("Slash Commands built for %s: %d commands; %d characters", codeName, builders.length, characterCount);
		}catch(ex) {
			Logger.package("@rsc-apps/command").error(ex);
		}

	}
}
main();
