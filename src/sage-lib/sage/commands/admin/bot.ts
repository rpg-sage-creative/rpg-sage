import { GameSystemType } from "@rsc-sage/types";
import { getBuildInfo, isDefined } from "@rsc-utils/core-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import type { Bot } from "../../model/Bot.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { createAdminRenderableContent } from "../cmd.js";

async function botDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	return sendBot(sageMessage);
}

function searchStatusToReadable(status: string | boolean): string {
	if (status === true) {
		return "Search currently active.";
	}else if (status === false) {
		return "Not capable of search.";
	}
	return status;
}

function keyAndStatusToOutput(gameSystem: GameSystemType, status: boolean | string): string {
	const emoji = status === true ? ":green_circle:" : status === false ? ":no_entry_sign:" : ":yellow_circle:";
	return `[spacer] ${emoji} <b>${GameSystemType[gameSystem]}</b> ${searchStatusToReadable(status)}`;
}

function getBotSearchStatus(bot: Bot): string[] {
	return Object.keys(GameSystemType)
		.filter(key => +key)
		.map(key => keyAndStatusToOutput(+key, bot.getSearchStatus(+key)));
}

async function sendBot(sageMessage: SageMessage): Promise<void> {
	const { bot } = sageMessage;
	const renderableContent = createAdminRenderableContent(bot);
	renderableContent.setTitle(`<b>${bot.codeName}</b>`);
	const botUser = await sageMessage.discord.fetchUser(bot.did);
	if (botUser) {
		renderableContent.setThumbnailUrl(botUser.displayAvatarURL());
		renderableContent.append(`<b>Username</b> ${toHumanReadable(botUser)}`);
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
	await sageMessage.send(renderableContent);
}

async function setBotSearchStatus(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const gameSystem = sageMessage.args.getEnum(GameSystemType, "gameSystem");
	const enabled = sageMessage.args.getBoolean("enabled");
	if (!gameSystem || !isDefined(enabled)) {
		return sageMessage.whisper("Invalid `gameSystem` or `enabled` value.");
	}

	const message = sageMessage.args.getString("message");

	const status = enabled ? true : message ?? false;
	const saved = await sageMessage.bot.setSearchStatus(gameSystem, status);
	await sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return sendBot(sageMessage);
	}
}

async function botCodeVersion(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.isSuperUser) {
		const buildInfo = await getBuildInfo();
		const lines: string[] = [];
		lines.push(`### ${buildInfo.name}`);
		lines.push(`**version** \`${buildInfo.version}\``);
		lines.push(`**branch** \`${buildInfo.branch}\``);
		lines.push(`**buildDate** \`${buildInfo.buildDate}\``);
		lines.push(`### rsc-utils`);
		buildInfo.rscLibs.sort().forEach(lib => {
			lines.push(`- **${lib.name}** \`${lib.version}\``);
		});
		await sageMessage.send(lines.join("\n"));
	}
}

export function registerBot(): void {
	registerListeners({ commands:["bot|details"], message:botDetails });
	registerListeners({ commands:["code|version"], message:botCodeVersion });
	registerListeners({ commands:["bot|set|search|status"], message:setBotSearchStatus });
}
