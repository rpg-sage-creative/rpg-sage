import { REST } from "@discordjs/rest";
import { error, info } from "@rsc-utils/console-utils";
import { Routes } from "discord-api-types/v9";
import type { BotCore } from "../types.js";

export async function wipeSlashCommands(bot: BotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(bot.token);
	try {
		info(`Started wiping application (/) commands for: ${bot.codeName}`);

		await rest.put(Routes.applicationCommands(bot.did), {
			body: []
		});

		info(`Successfully wiped application (/) commands for: ${bot.codeName}.`);
	} catch (ex) {
		error(Object.keys(ex as any));
	}
}