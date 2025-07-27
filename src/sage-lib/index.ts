import { error } from "@rsc-utils/core-utils";
import { DiscordCache, getSageId } from "@rsc-utils/discord-utils";
import { registerAndLoad } from "../sage-pf2e/index.js";
import { registerPrompts } from "./discord/index.js";
import { registerCommandHandlers } from "./sage/commands/index.js";
import { ActiveBot } from "./sage/model/ActiveBot.js";
import { globalCachePopulate } from "./sage/repo/base/globalCache.js";

export async function activate(): Promise<void> {
	DiscordCache.setSageId(getSageId());

	const bot = await ActiveBot.prepBot().catch(error);
	if (!bot) {
		process.exit(1);
	}

	//setSageDialogWebhookName()
	//setTestBotId();

	registerCommandHandlers();
	registerPrompts();

	await registerAndLoad();

	globalCachePopulate("servers");
	globalCachePopulate("users");
	globalCachePopulate("games");

	ActiveBot.load(bot);
}

/*
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
