import { GameSystemType } from "@rsc-sage/data-layer";
import { isDefined, readRepo } from "@rsc-utils/core-utils";
import { toDiscordDate, toHumanReadable } from "@rsc-utils/discord-utils";
import { registerListeners } from "../../../discord/handlers/registerListeners.js";
import type { Bot } from "../../model/Bot.js";
import type { SageMessage } from "../../model/SageMessage.js";
import { createAdminRenderableContent } from "../cmd.js";

async function botDetails(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.actor.sage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	return sendBot(sageMessage);
}

function statusToEmoji(status: string | boolean): string {
	if (status === true) {
		return ":green_circle:";
	}else if (status === false) {
		return ":no_entry_sign:";
	}
	return ":yellow_circle:";
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
	const emoji = statusToEmoji(status);
	const gameLabel = GameSystemType[gameSystem];
	const statusLabel = searchStatusToReadable(status);
	return `[spacer] ${emoji} <b>${gameLabel}</b> ${statusLabel}`;
}

function getBotSearchStatus(bot: Bot): string[] {
	return Object.keys(GameSystemType)
		.filter(key => +key)
		.map(key => keyAndStatusToOutput(+key, bot.getSearchStatus(+key)));
}

function pathbuilderImportStatusToReadable(status: string | boolean): string {
	if (status === true) {
		return "Pathbuilder Search Enabled";
	}else if (status === false) {
		return "Pathbuilder Search Disabled";
	}
	return status;
}

function getBotPathbuilderImportStatus(bot: Bot): string[] {
	const status = bot.getPathbuilderImportStatus();
	const emoji = status === true ? ":green_circle:" : status === false ? ":no_entry_sign:" : ":yellow_circle:";
	const statusLabel = pathbuilderImportStatusToReadable(status);
	return [`[spacer] ${emoji} ${statusLabel}`];
}

async function sendBot(sageMessage: SageMessage): Promise<void> {
	const { bot } = sageMessage;
	const renderableContent = createAdminRenderableContent(bot);
	renderableContent.setTitle(`<b>${bot.codeName}</b>`);
	const botUser = await sageMessage.discord.fetchUser(bot.id);
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
		renderableContent.append(`<b>User Id</b> ${bot.id || "<i>NOT SET</i>"}`);
		renderableContent.append(`<b>Status</b> ${"<i>NOT FOUND</i>"}`);
	}
	renderableContent.appendTitledSection("Pathbuilder Import Status", ...getBotPathbuilderImportStatus(bot));
	renderableContent.appendTitledSection("Search Engine Status by Game", ...getBotSearchStatus(bot));
	await sageMessage.send(renderableContent);
}

async function setBotSearchStatus(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.actor.sage.isSuperUser) {
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

async function setBotPathbuilderImportstatus(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.actor.sage.isSuperUser) {
		return sageMessage.reactBlock();
	}
	const enabled = sageMessage.args.getBoolean("enabled");
	if (!isDefined(enabled)) {
		return sageMessage.whisper("Invalid or `enabled` value.");
	}

	const message = sageMessage.args.getString("message");

	const status = enabled ? true : message ?? false;
	const saved = await sageMessage.bot.setPathbuilderImportStatus(status);
	await sageMessage.reactSuccessOrFailure(saved);
	if (saved) {
		return sendBot(sageMessage);
	}
}

async function botCodeVersion(sageMessage: SageMessage): Promise<void> {
	if (sageMessage.actor.sage.isSuperUser) {
		const repoInfo = await readRepo(".");
		if (repoInfo?.package) {
			const lines: string[] = [];

			lines.push(`### ${repoInfo.package.name ?? "rpg-sage"}`);
			lines.push(`**version** \`${repoInfo.package.version ?? "unknown"}\``);

			lines.push(`**branch** \`${repoInfo?.branch?.trim() ?? "unknown"}\``);

			const commitUrl = repoInfo?.commit?.hash
				? `[${repoInfo.commit.hash}](<https://github.com/rpg-sage-creative/rpg-sage/commit/${repoInfo.commit.hash}>)`
				: "`unknown`";
			lines.push(`**commit** ${commitUrl}`);

			const buildTs = repoInfo?.build?.birthtimeMs || repoInfo?.build?.ctimeMs || 0;
			if (buildTs) {
				const date = new Date(buildTs);
				lines.push(`**build** ${toDiscordDate(date, "R")}`);
				lines.push(`- UTC \`${date.toISOString()}\``);
			}else {
				lines.push("**buildDate** `unknown`");
			}

			lines.push(`### rsc-utils`);
			repoInfo?.rscUtils?.sort().forEach(lib => {
				lines.push(`- **${lib.name}** \`${lib.version}\``);
			});

			await sageMessage.send(lines.join("\n"));
		}
	}
}

export function registerBot(): void {
	registerListeners({ commands:["bot|details"], message:botDetails });
	registerListeners({ commands:["code|version"], message:botCodeVersion });
	registerListeners({ commands:["bot|set|search|status"], message:setBotSearchStatus });
	registerListeners({ commands:["bot|set|pathbuilder|import|status"], message:setBotPathbuilderImportstatus });
}
