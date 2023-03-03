import { GameType } from "../../../../sage-common";
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
	const botDid = firstMention?.id ?? sageMessage.args.findUserDid("bot", true);
	const bot = (await sageMessage.caches.bots.getByDid(botDid)) ?? sageMessage.bot;

	return sendBot(sageMessage, bot);
}

function searchStatusToReadable(status: string | boolean): string {
	if (status === true) {
		return "Search currently active.";
	}else if (status === false) {
		return "Not capable of search.";
	}
	return status;
}
function keyAndStatusToOutput(gameType: GameType, status: boolean | string): string {
	const emoji = status === true ? ":green_circle:" : status === false ? ":no_entry_sign:" : ":yellow_circle:";
	return `[spacer] ${emoji} <b>${GameType[gameType]}</b> ${searchStatusToReadable(status)}`;
}
function getBotSearchStatus(bot: Bot): string[] {
	return Object.keys(GameType)
		.filter(key => +key)
		.map(key => keyAndStatusToOutput(+key, bot.getSearchStatus(+key)));
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
		renderableContent.appendTitledSection("Search Engine Status by Game", ...getBotSearchStatus(bot));
	} else {
		renderableContent.append(`<blockquote>Bot Not Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function setBotSearchStatus(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}

	const gameType = sageMessage.args.getEnum<GameType>(GameType, "game");
	if (!gameType) {
		return sageMessage.reactFailure("Unable to parse GameType.");
	}

	const enabled = sageMessage.args.getBoolean("enabled");
	const disabledMessage = sageMessage.args.getString("message");
	const status = enabled ?? (disabledMessage || "Unknown Reason");

	const saved = await sageMessage.bot.setSearchStatus(gameType, status);
	await sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return sendBot(sageMessage, sageMessage.bot);
	}
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

	registerAdminCommand(setBotSearchStatus, "bot-set-search-status");
}
