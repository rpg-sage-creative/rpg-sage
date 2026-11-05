import { REST } from "@discordjs/rest";
import { Logger } from "@rsc-utils/logger-utils";
import { Routes } from "discord-api-types/v9";

type WipeArgs = {
	appId: string;
	appToken: string;
	codeName: string;
};

export async function wipeSlashCommands({ appId, appToken, codeName }: WipeArgs): Promise<void> {
	const rest = new REST({version: '9'}).setToken(appToken);
	try {
		Logger.package("@rsc-chat/discord-utils").info(`Started wiping application (/) commands for: ${codeName}`);

		await rest.put(Routes.applicationCommands(appId), {
			body: []
		});

		Logger.package("@rsc-chat/discord-utils").info(`Successfully wiped application (/) commands for: ${codeName}.`);

	} catch (ex) {
		Logger.package("@rsc-chat/discord-utils").error(Object.keys(ex as any));
	}
}