import utils from "../../../../sage-utils";
import ActiveBot from "../../model/ActiveBot";
import type Bot from "../../model/Bot";
import type SageMessage from "../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../cmd";
import { registerAdminCommandHelp } from "../help";

async function botList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const bots: Bot[] = await sageMessage.caches.bots.getAll().catch(utils.ConsoleUtils.Catchers.errorReturnEmptyArray);
	for (const bot of bots) {
		await sendBot(sageMessage, bot);
	}
	return Promise.resolve();
}

async function botDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	const firstMention = sageMessage.message.mentions.users.first();
	const botDid = firstMention && firstMention.id || await sageMessage.args.removeAndReturnUserDid();
	const bot = botDid && (await sageMessage.caches.bots.getByDid(botDid)) || sageMessage.bot;

	return sendBot(sageMessage, bot);
}

async function sendBot(sageMessage: SageMessage, bot: Bot): Promise<void> {
	const renderableContent = createAdminRenderableContent(sageMessage.bot);
	if (bot) {
		renderableContent.setTitle(`<b>${bot.codeName}</b>`);
		renderableContent.append(bot.id);
		const botUser = await sageMessage.discord.fetchUser(bot.did);
		if (botUser) {
			renderableContent.setThumbnailUrl(botUser.displayAvatarURL());
			renderableContent.append(`<b>Username</b> @${botUser.tag}`);
			renderableContent.append(`<b>User Id</b> ${botUser.id}`);
			//TODO: resolved to a guildmember to get presence and last message
			// renderableContent.append(`<b>Status</b> ${botUser.presence.status}`);
			// const lastMessage = botUser.lastMessage;
			// if (lastMessage) {
			// 	renderableContent.append(`<b>Last Message Guild</b> ${lastMessage.guild && lastMessage.guild.name || "non-guild message"}`);
			// 	renderableContent.append(`<b>Last Message Date</b> ${lastMessage.createdAt.toUTCString()}`);
			// }
		} else {
			renderableContent.append(`<b>Username</b> ${"<i>UNKNOWN</i>"}`);
			renderableContent.append(`<b>User Id</b> ${bot.did || "<i>NOT SET</i>"}`);
			renderableContent.append(`<b>Status</b> ${"<i>NOT FOUND</i>"}`);
		}
	} else {
		renderableContent.append(`<blockquote>Bot Not Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function botCodeVersion(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.isSuperUser) {
		await sageMessage.send(ActiveBot.active.codeVersion);
	}
}

export default function register(): void {
	registerAdminCommand(botList, "bot-list");
	registerAdminCommandHelp("Admin", "SuperUser", "Bot", "bot list");

	registerAdminCommand(botDetails, "bot-details");
	registerAdminCommandHelp("Admin", "SuperUser", "Bot", "bot details");
	registerAdminCommandHelp("Admin", "SuperUser", "Bot", "bot details {@UserMention}");
	registerAdminCommandHelp("Admin", "SuperUser", "Bot", "bot details {UserId}");

	registerAdminCommand(botCodeVersion, "code-version");
}
