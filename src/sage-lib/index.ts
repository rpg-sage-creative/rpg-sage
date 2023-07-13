import { getBotCodeName } from "../env.mjs";
import { registerAndLoad } from "../sage-pf2e";
import { LogLevel, startHandling } from "../sage-utils/ConsoleUtils";
import { DiscordFetches } from "../sage-utils/DiscordUtils";
import { addAcceptableBot } from "./discord/handlers";
import { registerCommandHandlers } from "./sage/commands";
import { ActiveBot } from "./sage/model/ActiveBot";
import { BotRepo } from "./sage/repo/BotRepo";
/*
// import type { Bot } from "./sage/model/Bot";
// import { Server } from "./sage/model/Server";
*/

export function activate(): void {
	const logLevel = getBotCodeName() === "dev" ? LogLevel.Info : LogLevel.Warn;
	startHandling(logLevel);

	BotRepo.getByCodeName(getBotCodeName()).then(bot => {
		if (!bot) {
			console.error(`BotRepo.getByCodeName("${getBotCodeName()}") failed!`);
			return;
		}

		DiscordFetches.botId = bot.did;
		DiscordFetches.webhookName = bot.dialogWebhookName;
		addAcceptableBot(...bot.acceptableBots);

		/*
		// configureCommands(bot);
		*/

		registerCommandHandlers();

		registerAndLoad().then(() => new ActiveBot(bot.toJSON(), "rpg-sage\n1.6.9"));
	}, err => {
		console.error(`BotRepo.getByCodeName("${getBotCodeName()}") failed!`, err);
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
