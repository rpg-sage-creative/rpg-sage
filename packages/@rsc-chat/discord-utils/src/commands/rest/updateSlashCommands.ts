import { REST } from "@discordjs/rest";
import { error, errorReturnUndefined, info } from "@rsc-utils/core-utils";
import { Routes } from "discord-api-types/v9";
import { buildCommands } from "../builders/buildCommands.js";

type CommandPathValidator = (commandPath: string) => boolean;

type UpdateArgs = {
	appId: string;
	appToken: string;
	codeName: string;
	commandPathValidator: CommandPathValidator;
};

export async function updateSlashCommands({ appId, appToken, codeName, commandPathValidator }: UpdateArgs): Promise<void> {
	info(`Started building application (/) commands for: ${codeName}`);

	const body = await buildCommands(commandPathValidator).catch(errorReturnUndefined);

	if (body) {
		info(`Successfully built application (/) commands for: ${codeName}`);
	}else {
		info(`Failed to build application (/) commands for: ${codeName}`);
		return;
	}

	const rest = new REST({version: '9'}).setToken(appToken);
	try {
		info(`Started refreshing application (/) commands for: ${codeName}`);

		await rest.put(Routes.applicationCommands(appId), { body });

		info(`Successfully reloaded application (/) commands for: ${codeName}.`);
	} catch (ex: any) {
		// console.info(Object.keys(error as any)); // [ 'rawError', 'code', 'status', 'method', 'url', 'requestBody' ]
		// console.error(`${error.code} (${error.rawError}): ${error.status}`); // undefined (undefined): undefined
		error(ex);
	}
}