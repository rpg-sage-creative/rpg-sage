import { getSageId } from "@rsc-sage/env";
import { error, getEndpoint, getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { DiscordCache } from "@rsc-utils/discord-utils";
import { RenderableMap } from "@rsc-utils/map-utils";
import { registerPromptHandler } from "./sage-lib/discord/prompts.js";
import { registerCommandHandlers } from "./sage-lib/sage/commands/index.js";
import { ActiveBot } from "./sage-lib/sage/model/ActiveBot.js";
import { globalCachePopulate } from "./sage-lib/sage/repo/base/globalCache.js";
import { registerAndLoadPf2eData } from "./sage-pf2e/index.js";

initializeConsoleUtilsByEnvironment();

DiscordCache.setSageId(getSageId());

const services = ["Map"];

/*
	By default, maps are rendered in Sage's primary thread.
	We can run them in separate processes using pm2 and services.config.cjs.
	The --spawnServices flag tells Sage to run those services as child processes of Sage to simplify starting/stopping for testing.
*/
if (process.argv.includes("--spawnServices")) {
	services.forEach(serviceName => {
		RenderableMap.startServer(getPort(serviceName));
	});
}

/*
	Whether we spawn the services or not, we need to set the endpoints
*/
services.forEach(serviceName => {
	RenderableMap.setEndpoint(getEndpoint(serviceName));
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

globalCachePopulate("servers");
globalCachePopulate("users");
globalCachePopulate("games");

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

