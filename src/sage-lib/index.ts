import { error } from "@rsc-utils/console-utils";
import { registerAndLoad } from "../sage-pf2e";
import { getBotCodeName } from "../sage-utils/utils/EnvUtils";
import registerPrompts from "./discord";
import { setBotMeta } from "./discord/handlers";
import { SageDialogWebhookName } from "./discord/messages";
import { registerCommandHandlers } from "./sage/commands";
import ActiveBot from "./sage/model/ActiveBot";
import BotRepo from "./sage/repo/BotRepo";

export async function activate(): Promise<void> {
	const botCodeName = getBotCodeName();
	const bot = await BotRepo.getByCodeName(botCodeName).catch(err => {
		error(`BotRepo.coreByCodeName("${botCodeName}") failed!`, err);
		return null;
	});
	if (!bot) {
		process.exit(1);
	}

	setBotMeta({ activeBotDid:bot.did, dialogWebhookName:SageDialogWebhookName, testBotDid:undefined });

	registerCommandHandlers();
	registerPrompts();

	await registerAndLoad();

	await ActiveBot.activate(botCodeName);
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
