import { REST } from "@discordjs/rest";
import { getToken } from "@rsc-sage/env";
import { error, info } from "@rsc-utils/core-utils";
import { Routes } from "discord-api-types/v9";
import type { BotCore } from "../index.js";

export async function wipeSlashCommands(bot: BotCore): Promise<void> {
	const rest = new REST({version: '9'}).setToken(getToken());
	try {
		info(`Started wiping application (/) commands for: ${bot.codeName}`);

		await rest.put(Routes.applicationCommands(bot.id), {
			body: []
		});

		info(`Successfully wiped application (/) commands for: ${bot.codeName}.`);
	} catch (ex) {
		error(Object.keys(ex as any));
	}
}