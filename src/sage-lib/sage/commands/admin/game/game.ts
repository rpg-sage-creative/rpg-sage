import { type SageChannel } from "@rsc-sage/types";
import { sortComparable } from "@rsc-utils/array-utils";
import { toChannelMention } from "@rsc-utils/discord-utils";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { Game } from "../../../model/Game.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { SageMessage } from "../../../model/SageMessage.js";
import type { Server } from "../../../model/Server.js";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd.js";
import { registerAdminCommandHelp } from "../../help.js";

async function getGames(sageCommand: SageCommand): Promise<Game[]> {
	const guild = sageCommand.discord.guild;
	if (guild) {
		if (sageCommand.canAdminGames) {
			return sageCommand.sageCache.games.getByServerDid(guild.id);
		}
	} else if (sageCommand.isSuperUser) {
		return sageCommand.sageCache.games.getAll();
	}
	return [];
}

async function gameCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminServer) {
		return sageMessage.reactBlock();
	}
	const games = await getGames(sageMessage);
	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>game-count</b>`);
	renderableContent.append(`<b>Active</b> ${games.filter(game => !game.isArchived).length}`);
	renderableContent.append(`<b>Archived</b> ${games.filter(game => game.isArchived).length}`);
	renderableContent.append(`<b>Total</b> ${games.length}`);
	return <any>sageMessage.send(renderableContent);
}

async function myGameList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.allowCommand) {
		return sageMessage.reactBlock();
	}
	const myDid = sageMessage.authorDid;
	const allGames = await sageMessage.sageCache.games.getAll();

	let gameCount = 0;
	const serverGameMap = new Map<Server, Game[]>();
	for (const game of allGames) {
		if (!game.isArchived && (await game.hasUser(myDid))) {
			if (!serverGameMap.has(game.server)) {
				serverGameMap.set(game.server, []);
			}
			serverGameMap.get(game.server)!.push(game);
			gameCount++;
		}
	}

	const renderableContent = createAdminRenderableContent(sageMessage.bot);
	renderableContent.setTitle(`<b>my-games</b>`);
	if (gameCount) {
		const servers = Array.from(serverGameMap.keys());
		const UNKNOWN_SERVER = "<i>Unknown Server</i>";
		let hasUnknownServer = false;
		for (const server of servers) {
			const guildName = server.name ?? await sageMessage.discord.fetchGuildName(server.did, UNKNOWN_SERVER);
			hasUnknownServer = hasUnknownServer || guildName === UNKNOWN_SERVER;
			renderableContent.appendSection(`<br/><b>${guildName}</b>`);

			const games = serverGameMap.get(server)!;
			for (const game of games) {
				const isGM = game.hasGameMaster(myDid);
				let channel: SageChannel | undefined;

				renderableContent.append(`[spacer]<b>${game.name}</b>`);
				renderableContent.append(`[spacer][spacer]<b>Role</b> ${isGM ? "GameMaster" : "Player"}`);
				if (isGM) {
					channel = await game.findBestGameMasterChannel();
				} else {
					channel = await game.findBestPlayerChannel();
					const myPC = game.playerCharacters.findByUser(myDid);
					renderableContent.append(`[spacer][spacer]<b>Character</b> ${myPC?.name ?? "<i>None</i>"}`);
				}
				if (channel) {
					renderableContent.append(`[spacer][spacer]<b>Channel</b> ${toChannelMention(channel.id)}`);
				}
			}
		}
		if (hasUnknownServer) {
			renderableContent.append(`<i>Unknown Servers are servers that don't have this version of Sage.</i>`);
		}
	} else {
		renderableContent.append(`<blockquote>No Games Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function gameList(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGames) {
		return sageMessage.reactBlock();
	}
	let games = await getGames(sageMessage);
	if (!games) {
		return Promise.resolve();
	}

	const archived = sageMessage.command?.includes("archive") ?? false;
	games = games.filter(game => !!game.isArchived === archived);

	const filter = sageMessage.args.join(" ");
	if (filter && games.length) {
		const lower = filter.toLowerCase();
		games = games.filter(game => game.name && game.name.toLowerCase().includes(lower));
	}
	games.sort(sortComparable);

	const renderableContent = createAdminRenderableContent(sageMessage.bot);
	renderableContent.setTitle(`<b>game${archived ? "-archive" : ""}-list</b>`);
	if (games.length) {
		games.forEach(game => renderableContent.appendTitledSection(`<b>${game.name}</b>`, <string>game.id));
	} else {
		renderableContent.append(`<blockquote>No${archived ? " Archived" : ""} Games Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

async function gameToggleDicePing(sageMessage: SageMessage): Promise<void> {
	const gameChannel = sageMessage.gameChannel;
	if (gameChannel && (sageMessage.isGameMaster || sageMessage.isPlayer)) {
		const message = sageMessage.isGameMaster
			? "Do you want to get a ping when dice are rolled in this game?"
			: "Do you want to get a ping when you roll dice in this game?";
		const yesNo = await discordPromptYesNo(sageMessage, message);
		if (yesNo === true || yesNo === false) {
			const updated = await sageMessage.game?.updateDicePing(sageMessage.authorDid, yesNo);
			sageMessage.reactSuccessOrFailure(updated === true);
		}
	}
	return Promise.resolve();
}

export function registerGame(): void {
	registerAdminCommand(gameCount, "game-count");
	registerAdminCommandHelp("Admin", "Game", "game count");

	registerAdminCommand(myGameList, "my-games");

	registerAdminCommand(gameList, "game-list", "games-list", "game-archive-list", "games-archive-list");
	registerAdminCommandHelp("Admin", "Game", "game archive list");
	registerAdminCommandHelp("Admin", "Game", "game list");

	registerAdminCommand(gameToggleDicePing, "game-toggle-dice-ping");
	registerAdminCommandHelp("Admin", "Game", `game toggle dice ping`);


}
