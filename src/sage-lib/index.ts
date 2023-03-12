import utils, { LogLevel } from "../sage-utils";
import { addAcceptableBot } from "./discord/handlers";
import { registerAndLoad } from "../sage-pf2e";
import { registerCommandHandlers } from "./sage/commands";
import ActiveBot from "./sage/model/ActiveBot";
import type { TBotCodeName } from "./sage/model/Bot";
import BotRepo from "./sage/repo/BotRepo";
import DiscordFetches from "../sage-utils/utils/DiscordUtils/DiscordFetches";
/*
// import type Bot from "./sage/model/Bot";
// import Server from "./sage/model/Server";
*/

export function activate(pf2DataPath: string, botCodeName: TBotCodeName, ver: string, includePf2ToolsData = false): void {
	const logLevel = botCodeName === "dev" ? LogLevel.Info : LogLevel.Warn;
	utils.ConsoleUtils.startHandling(logLevel);

	BotRepo.getByCodeName(botCodeName).then(bot => {
		DiscordFetches.botId = bot.did;
		DiscordFetches.webhookName = bot.dialogWebhookName;
		addAcceptableBot(...bot.acceptableBots);

		/*
		// configureCommands(bot);
		*/

		registerCommandHandlers();

		registerAndLoad(pf2DataPath, includePf2ToolsData).then(() => ActiveBot.activate(botCodeName, ver));
	}, err => {
		console.error(`BotRepo.getByCodeName("${botCodeName}") failed!`, err);
	});
}

/*
// function configureCommands(bot: Bot): void {
// 	globalCommands(bot);
// 	guildCommands(bot);
// }

// function globalCommands(bot: Bot): void {
// 	const url = `https://discord.com/api/v8/applications/${bot.did}/commands`;
// }

// function guildCommands(bot: Bot): void {
// 	const serverDid = Server.HomeServerDid;
// 	const url = `https://discord.com/api/v8/applications/${bot.did}/guilds/${serverDid}/commands/permissions`;
// }
*/
