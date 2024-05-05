import { error, info } from "@rsc-utils/console-utils";
import { getBotCodeName, getDataRoot, initializeConsoleUtilsByEnvironment } from "@rsc-utils/env-utils";
import { listFilesSync, readJsonFileSync, writeFileSync } from "@rsc-utils/fs-utils";
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
	const botCodeName = getBotCodeName();
	const dataPathSage = getDataRoot("sage");

	const botsPath = `${dataPathSage}/bots`;
	const botJson = listFilesSync(botsPath, "json")
		.map(file => readJsonFileSync<BotCore>(`${botsPath}/${file}`))
		.find(json => json?.codeName === botCodeName);

	if (!botJson) {
		error(`Unable to find Bot: ${botCodeName}`);

	}else {
		if (process.argv.includes("update")) {
			// build and update all slash commands for the bot
			updateSlashCommands(botJson);

		}else if (process.argv.includes("wipe")) {
			// remove all slash commands for the bot
			wipeSlashCommands(botJson);

		}else {
			// build all slash commands for the bot and save the json
			try {
				const built = await buildCommands();
				writeFileSync(`../data/slash/${botCodeName}.json`, built, true, true);
				const characterCount = await countCharacters();
				info(`Slash Commands built for ${botCodeName}: ${built.length} commands; ${characterCount} characters`);
			}catch(ex) {
				error(ex);
			}
		}
	}
}
main();
