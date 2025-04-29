import { REST } from "@discordjs/rest";
import { getToken } from "@rsc-sage/env";
import { error, info } from "@rsc-utils/core-utils";
import { Routes } from "discord-api-types/v9";
import type { BotCore } from "../../sage-lib/sage/model/Bot.js";
import { buildCommands } from "../builders/buildCommands.js";

export async function updateSlashCommands(bot: BotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(getToken());
	try {
		info(`Started refreshing application (/) commands for: ${bot.codeName}`);

		await rest.put(Routes.applicationCommands(bot.id), {
			body: await buildCommands()
		});

		info(`Successfully reloaded application (/) commands for: ${bot.codeName}.`);
	} catch (ex: any) {
		// console.info(Object.keys(error as any)); // [ 'rawError', 'code', 'status', 'method', 'url', 'requestBody' ]
		// console.error(`${error.code} (${error.rawError}): ${error.status}`); // undefined (undefined): undefined
		error(ex);
	}
}