import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import type { IBotCore } from "./sage-lib/sage/model/Bot";
import utils from "./sage-utils";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev";

const botJson = utils.FsUtils.listFilesSync("./data/sage/bots")
	.map(file => utils.FsUtils.readJsonFileSync<IBotCore>(`./data/sage/bots/${file}`))
	.find(json => json?.codeName === botCodeName);
if (!botJson) {
	console.error(`Unable to find Bot: ${botCodeName}`);
}else {
	updateSlashCommands(botJson);
}

async function updateSlashCommands(bot: IBotCore): Promise<void> {
	const commands = [
		{
			name: 'help',
			description: 'Get basic Help for RPG Sage',
		},
	];

	const rest = new REST({version: '9'}).setToken(bot.token);

	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(Routes.applicationCommands(bot.did), {
			body: commands,
		});

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}

}

// node --experimental-modules --es-module-specifier-resolution=node slash.mjs