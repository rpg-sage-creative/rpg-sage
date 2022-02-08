import utils, { LogLevel } from "../sage-utils";
import registerPrompts from "./discord";
import { setBotMeta } from "./discord/handlers";
import { SageDialogWebhookName } from "./discord/messages";
import { registerAndLoad } from "../sage-pf2e";
import registerCommands from "./sage/commands";
import ActiveBot from "./sage/model/ActiveBot";
import type { TBotCodeName } from "./sage/model/Bot";
import BotRepo from "./sage/repo/BotRepo";
/*
// import type Bot from "./sage/model/Bot";
// import Server from "./sage/model/Server";
*/

export default function activate(pf2DataPath: string, botCodeName: TBotCodeName, ver: string, includePf2ToolsData = false): void {
	const logLevel = botCodeName === "dev" ? LogLevel.Info : LogLevel.Warn;
	utils.ConsoleUtils.startHandling(logLevel);

	BotRepo.getByCodeName(botCodeName).then(bot => {
		setBotMeta({ activeBotId:bot.id, dialogWebhookName:SageDialogWebhookName, testBotId:undefined });

		/*
		// configureCommands(bot);
		*/

		registerCommands();
		registerPrompts();

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
