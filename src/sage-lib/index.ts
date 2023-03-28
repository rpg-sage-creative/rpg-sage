import { registerAndLoad } from "../sage-pf2e";
import { LogLevel } from "../sage-utils";
import { startHandling } from "../sage-utils/utils/ConsoleUtils";
import DiscordFetches from "../sage-utils/utils/DiscordUtils/DiscordFetches";
import { addAcceptableBot } from "./discord/handlers";
import { registerCommandHandlers } from "./sage/commands";
import ActiveBot from "./sage/model/ActiveBot";
import type { TBotCodeName } from "./sage/model/Bot";
import BotRepo from "./sage/repo/BotRepo";
/*
// import type Bot from "./sage/model/Bot";
// import Server from "./sage/model/Server";
*/

export function activate(pf2DataPath: string, botCodeName: TBotCodeName, ver: string, includePf2ToolsData = false): void {
	const logLevel = botCodeName === "dev" ? LogLevel.Info : LogLevel.Warn;
	startHandling(logLevel);

	BotRepo.getByCodeName(botCodeName).then(bot => {
		if (!bot) {
			console.error(`BotRepo.getByCodeName("${botCodeName}") failed!`);
			return;
		}

		DiscordFetches.botId = bot.did;
		DiscordFetches.webhookName = bot.dialogWebhookName;
		addAcceptableBot(...bot.acceptableBots);

		/*
		// configureCommands(bot);
		*/

		registerCommandHandlers();

		registerAndLoad(pf2DataPath, includePf2ToolsData).then(() => new ActiveBot(bot.toJSON(), ver));
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
