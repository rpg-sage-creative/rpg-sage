import { setSageId } from "@rsc-sage/env";
import { error, getCodeName } from "@rsc-utils/core-utils";
import { registerAndLoad } from "../sage-pf2e";
import { registerPrompts } from "./discord/index.js";
import { registerCommandHandlers } from "./sage/commands/index.js";
import { ActiveBot } from "./sage/model/ActiveBot.js";
import { BotRepo } from "./sage/repo/BotRepo.js";

export async function activate(): Promise<void> {
	const botCodeName = getCodeName();
	const bot = await BotRepo.getByCodeName(botCodeName).catch(err => {
		error(`BotRepo.getByCodeName("${botCodeName}") failed!`, err);
		return null;
	});
	if (!bot) {
		process.exit(1);
	}

	setSageId(bot.did);
	//setSageDialogWebhookName()
	//setTestBotId();

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
