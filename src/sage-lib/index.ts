import { setSageId } from "@rsc-sage/env";
import { error } from "@rsc-utils/core-utils";
import { registerAndLoad } from "../sage-pf2e";
import { registerPrompts } from "./discord/index.js";
import { registerCommandHandlers } from "./sage/commands/index.js";
import { ActiveBot } from "./sage/model/ActiveBot.js";

export async function activate(): Promise<void> {
	const bot = await ActiveBot.prepBot().catch(error);
	if (!bot) {
		process.exit(1);
	}

	setSageId(bot.did);
	//setSageDialogWebhookName()
	//setTestBotId();

	registerCommandHandlers();
	registerPrompts();

	await registerAndLoad();

	ActiveBot.from(bot);
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
