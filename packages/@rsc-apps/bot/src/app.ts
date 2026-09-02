import { ActiveBot, registerAndLoadPf2eData, registerCommandHandlers, registerPromptHandler } from "@rsc-sage/core";
import { DataTable } from "@rsc-sage/data-layer";
import { getSageId } from "@rsc-sage/env";
import { error, getEndpoint, getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { DiscordCache } from "@rsc-utils/discord-utils";
import { RenderableMap } from "@rsc-utils/map-utils";

initializeConsoleUtilsByEnvironment();

DiscordCache.setSageId(getSageId());

const services = {
	"Map": RenderableMap,
};

/*
	By default, maps are rendered in Sage's primary thread.
	We can run them in separate processes using pm2 and services.config.cjs.
	The --spawnServices flag tells Sage to run those services as child processes of Sage to simplify starting/stopping for testing.
*/
const spawnServices = process.argv.includes("--spawnServices");

Object.entries(services).forEach(([ serviceName, service ]) => {
	// Whether we spawn the services or not, we need to set the endpoints
	service.setEndpoint(getEndpoint(serviceName));

	if (spawnServices) {
		service.startServer(getPort(serviceName));
	}
});

const bot = await ActiveBot.prepBot().catch(error);
if (!bot) {
	process.exit(1);
}

//setSageDialogWebhookName()
//setTestBotId();

registerCommandHandlers();
registerPromptHandler();

await registerAndLoadPf2eData();

await DataTable
	.initialize()
	.populate();

ActiveBot.load(bot);

/*
wtf was this for ?
// function configureCommands(bot: Bot): void {
// 	globalCommands(bot);
// 	guildCommands(bot);
// }

// function globalCommands(bot: Bot): void {
// 	const url = `https://discord.com/api/v8/applications/${bot.id}/commands`;
// }

// function guildCommands(bot: Bot): void {
// 	const serverDid = Server.HomeServerDid;
// 	const url = `https://discord.com/api/v8/applications/${bot.id}/guilds/${serverDid}/commands/permissions`;
// }
*/

