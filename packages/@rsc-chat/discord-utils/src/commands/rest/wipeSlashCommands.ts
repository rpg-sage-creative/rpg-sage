import { REST } from "@discordjs/rest";
import { error, info } from "@rsc-utils/core-utils";
import { Routes } from "discord-api-types/v9";

type WipeArgs = {
	appId: string;
	appToken: string;
	codeName: string;

};

export async function wipeSlashCommands({ appId, appToken, codeName }: WipeArgs): Promise<void> {
	const rest = new REST({version: '9'}).setToken(appToken);
	try {
		info(`Started wiping application (/) commands for: ${codeName}`);

		await rest.put(Routes.applicationCommands(appId), {
			body: []
		});

		info(`Successfully wiped application (/) commands for: ${codeName}.`);
	} catch (ex) {
		error(Object.keys(ex as any));
	}
}