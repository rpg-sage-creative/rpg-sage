import { REST } from "@discordjs/rest";
import { error, info } from "@rsc-utils/console-utils";
import { Routes } from "discord-api-types/v9";
import { buildCommands } from "../builders/buildCommands.js";
import type { BotCore } from "../types.js";

export async function updateSlashCommands(bot: BotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(bot.token);
	try {
		info(`Started refreshing application (/) commands for: ${bot.codeName}`);

		await rest.put(Routes.applicationCommands(bot.did), {
			body: await buildCommands()
		});

		info(`Successfully reloaded application (/) commands for: ${bot.codeName}.`);
	} catch (ex: any) {
		// console.info(Object.keys(error as any)); // [ 'rawError', 'code', 'status', 'method', 'url', 'requestBody' ]
		// console.error(`${error.code} (${error.rawError}): ${error.status}`); // undefined (undefined): undefined
		error(ex);
	}
}