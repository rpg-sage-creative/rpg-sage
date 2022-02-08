import utils, { Optional } from "../../../../../sage-utils";
import { CritMethodType, DiceOutputType, DiceSecretMethodType, GameType } from "../../../../../sage-dice";
import { DiscordId } from "../../../../discord";
import { discordPromptYesNo } from "../../../../discord/prompts";
import Game, { GameRoleType } from "../../../model/Game";
import GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";
import type Server from "../../../model/Server";
import type { IChannel } from "../../../repo/base/IdRepository";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { DicePostType } from "../../dice";
import { registerAdminCommandHelp } from "../../help";

async function getGames(sageMessage: SageMessage): Promise<Game[]> {
	const guild = sageMessage.discord.guild;
	if (guild) {
		if (sageMessage.canAdminGames) {
			return sageMessage.caches.games.getByServerDid(guild.id);
		}
	} else if (sageMessage.isSuperUser) {
		return sageMessage.caches.games.getAll();
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
	const allGames = await sageMessage.caches.games.getAll();

	let gameCount = 0;
	const serverGameMap = allGames.reduce((map, game) => {
		if (!game.isArchived && game.hasUser(myDid)) {
			if (!map.has(game.server)) {
				map.set(game.server, []);
			}
			map.get(game.server)!.push(game);
			gameCount++;
		}
		return map;
	}, new Map<Server, Game[]>());

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
				let channel: IChannel | undefined;

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
					renderableContent.append(`[spacer][spacer]<b>Channel</b> ${DiscordId.toChannelReference(channel.did)}`);
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
	games.sort(utils.ArrayUtils.Sort.sortComparable);

	const renderableContent = createAdminRenderableContent(sageMessage.bot);
	renderableContent.setTitle(`<b>game${archived ? "-archive" : ""}-list</b>`);
	if (games.length) {
		games.forEach(game => renderableContent.appendTitledSection(`<b>${game.name}</b>`, <string>game.id));
	} else {
		renderableContent.append(`<blockquote>No${archived ? " Archived" : ""} Games Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

//#region date/time
function padDateNumber(num: number): string {
	return String(num).padStart(2, "0");
}
function _formatDate(date: Date): string {
	return `${date.getFullYear()}-${padDateNumber(date.getMonth())}-${padDateNumber(date.getDate())}`;
}
function _formatTime(date: Date): string {
	return `${padDateNumber(date.getHours())}:${padDateNumber(date.getMinutes())}:${padDateNumber(date.getSeconds())}`;
}
function formatDateTime(date: Date): string | null {
	return date ? `${_formatDate(date)} ${_formatTime(date)}` : null;
}
//#endregion

async function showGameGetGame(sageMessage: SageMessage): Promise<Game | null> {
	let game: Optional<Game> = sageMessage.game;
	if (!game) {
		const gameId = sageMessage.args.find(utils.UuidUtils.isValid);
		if (gameId) {
			game = await sageMessage.caches.games.getById(gameId);
		}
		if (!game) {
			await sageMessage.reactFailure();
		}
	}
	if (!sageMessage.canAdminGames && !game?.hasGameMaster(sageMessage.authorDid)) {
		await sageMessage.reactBlock();
	}
	return game ?? null;
}
function showGameGetInheritedGameType(game: Game): GameType {
	return game.gameType ?? game.server.defaultGameType ?? GameType.None;
}

function showGameRenderGameType(renderableContent: utils.RenderUtils.RenderableContent, game: Game): void {
	const gameType = GameType[game.gameType!] ?? `<i>inherited (${GameType[showGameGetInheritedGameType(game)]})</i>`;
	renderableContent.append(`<b>GameType</b> ${gameType}`);
}

function gameDetailsAppendDice(renderableContent: utils.RenderUtils.RenderableContent, game: Game): void {
	const server = game.server;
	renderableContent.append(`<b>Default Dice Options</b>`);

	if (game.gameType === GameType.PF2e) {
		const critMethodType: keyof typeof CritMethodType | undefined = <keyof typeof CritMethodType>CritMethodType[game.defaultCritMethodType!];
		const inheritedCritMethodType = CritMethodType[server.defaultCritMethodType ?? CritMethodType.TimesTwo];
		renderableContent.append(`[spacer]<b>Crit Math</b> ${critMethodType ?? `<i>inherited (${inheritedCritMethodType})</i>`}`);
	} else {
		renderableContent.append(`[spacer]<b>Crit Math</b> <i>currently only available for PF2e</i>`);
	}

	const diceOutputType: keyof typeof DiceOutputType | undefined = <keyof typeof DiceOutputType>DiceOutputType[game.defaultDiceOutputType!];
	const inheritedDiceOutputType = DiceOutputType[server.defaultDiceOutputType ?? DiceOutputType.M];
	renderableContent.append(`[spacer]<b>Output Format</b> ${diceOutputType ?? `<i>inherited (${inheritedDiceOutputType})</i>`}`);

	const dicePostType: keyof typeof DicePostType | undefined = <keyof typeof DicePostType>DicePostType[game.defaultDicePostType!];
	const inheritedDicePostType = DicePostType[server.defaultDicePostType ?? DicePostType.SinglePost];
	renderableContent.append(`[spacer]<b>Post Style</b> ${dicePostType ?? `<i>inherited (${inheritedDicePostType})</i>`}`);

	const diceSecretMethodType: keyof typeof DiceSecretMethodType | undefined = <keyof typeof DiceSecretMethodType>DiceSecretMethodType[game.defaultDiceSecretMethodType!];
	const inheritedDiceSecretMethodType = DiceSecretMethodType[server.defaultDiceSecretMethodType ?? DiceSecretMethodType.Ignore];
	renderableContent.append(`[spacer]<b>Secret Checks</b> ${diceSecretMethodType ?? `<i>inherited (${inheritedDiceSecretMethodType})</i>`}`);
}

async function showGameRenderServer(renderableContent: utils.RenderUtils.RenderableContent, sageMessage: SageMessage, game: Game): Promise<void> {
	if (game !== sageMessage.game && sageMessage.isSuperUser) {
		renderableContent.appendTitledSection("<b>Server</b>", game.serverDid, game.serverId);
		const guild = await sageMessage.discord.fetchGuild(game.serverDid);
		if (guild) {
			renderableContent.append(`<b>Name</b> ${guild.name}`);
			renderableContent.append(`<b>Available</b> ${guild.available}`);
		} else {
			renderableContent.append(`${"<i>NOT FOUND!</i>"}`);
		}
	}
}

async function gameDetails(sageMessage: SageMessage, skipPrune = false): Promise<void> {
	const game = await showGameGetGame(sageMessage);
	if (!game) {
		return Promise.resolve();
	}

	const renderableContent = createAdminRenderableContent(game);

	renderableContent.setTitle(`<b>${game.name}</b>`);
	renderableContent.append(game.id);
	showGameRenderGameType(renderableContent, game);

	renderableContent.append(`<b>Created</b> ${formatDateTime(game.createdDate)}`);
	if (game.archivedDate) renderableContent.append(`[spacer]<b>Archived</b> ${formatDateTime(game.archivedDate) ?? "<i>Active</i>"}`);

	const guildChannels = (await game.guildChannels()).map(guildChannel => guildChannel ? `#${guildChannel.name}` : `<i>unavailable</i>`);
	renderableContent.append(`<b>Channels</b> ${guildChannels.length}; ${guildChannels.join(", ")}`);

	const guildRoles = await game.guildRoles();
	const roles = guildRoles.map(guildRole => guildRole ? `@${guildRole.name} (${GameRoleType[game.roles.find(role => role.did === guildRole.id)?.type!]})` : `<i>unavailable</i>`);
	renderableContent.append(`<b>Roles</b> ${roles.length}; ${roles.join(", ")}`);

	const gmGuildMembers = await game.gmGuildMembers();
	const gameMasters = gmGuildMembers.map((gmGuildMember, index) => gmGuildMember ? `@${gmGuildMember.user?.tag ?? gmGuildMember.displayName}` : `<i>${game.gameMasters[index]}</i>`);
	renderableContent.append(`<b>Game Master Name</b> ${game.gmCharacterName ?? `<i>inherited (${game.server.defaultGmCharacterName ?? GameCharacter.defaultGmCharacterName})</i>`}`);
	renderableContent.append(`<b>Game Masters</b> ${gameMasters.length}`);
	gameMasters.forEach(gm => renderableContent.append(`[spacer]${gm}`));

	renderableContent.append(`<b>NonPlayer Characters</b> ${game.nonPlayerCharacters.length}`);

	const playerGuildMembers = await game.pGuildMembers();
	const players = playerGuildMembers.map((pGuildMember, index) => pGuildMember ? `@${pGuildMember.user?.tag ?? pGuildMember.displayName}` : `<i>${game.players[index]}</i>`);
	const playerCharacters = playerGuildMembers.map(pGuildMember => game.playerCharacters.findByUser(pGuildMember?.id)?.name).map(name => name ? ` (${name})` : ``);
	renderableContent.append(`<b>Players (Characters)</b> ${players.length}`);
	players.forEach((player, index) => renderableContent.append(`[spacer]${player}${playerCharacters[index]}`));

	const orphanPCs = game.orphanedPlayerCharacters;
	if (orphanPCs.length) {
		renderableContent.append(`<b>Orphaned Player Characters</b> ${orphanPCs.length}`);
		orphanPCs.forEach(pc => renderableContent.append(`[spacer]${pc.name}`));
	}

	gameDetailsAppendDice(renderableContent, game);
	await showGameRenderServer(renderableContent, sageMessage, game);
	await sageMessage.send(renderableContent);

	if (sageMessage.server && !skipPrune) {
		const missingPlayerSnowflakes = playerGuildMembers
			.map((guildMember, index) => { return { guildMember: guildMember, index: index }; })
			.filter(meta => !meta.guildMember)
			.map(meta => game.players[meta.index]);
		const missingPlayers = missingPlayerSnowflakes.length > 0;

		const missingGmSnowflakes = gmGuildMembers
			.map((guildMember, index) => { return { guildMember: guildMember, index: index }; })
			.filter(meta => !meta.guildMember)
			.map(meta => game.gameMasters[meta.index]);
		const missingGms = missingGmSnowflakes.length > 0;

		if (missingPlayers || missingGms) {
			const message = [
				missingPlayers ? `${missingPlayerSnowflakes.length} player(s) left the server.` : ``,
				missingGms ? `${missingGmSnowflakes.length} game master(s) left the server.` : ``,
				`Remove them from the game?`
			].filter(s => s).join("\n");

			const remove = await discordPromptYesNo(sageMessage, message);
			if (remove) {
				let showAgain = false;
				const unable: string[] = [];
				if (missingPlayers) {
					const removed = await game.removePlayers(missingPlayerSnowflakes);
					if (removed) {
						showAgain = true;
					} else {
						unable.push(`<i>Unable to remove player(s)!</i>`);
					}
				}
				if (missingGms) {
					const removed = await game.removeGameMasters(missingGmSnowflakes);
					if (removed) {
						showAgain = true;
					} else {
						unable.push(`<i>Unable to remove game master(s)!</i>`);
					}
				}
				if (showAgain) {
					await gameDetails(sageMessage, true);
				}
			}
		}

	}
}

async function gameCreate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGames || !sageMessage.channelDid) {
		return sageMessage.reactBlock();
	}

	if (sageMessage.game) {
		return sageMessage.reactFailure();
	}

	const gameType = sageMessage.args.removeAndReturnGameType();
	const critMethodType = sageMessage.args.removeAndReturnCritMethodType();
	const diceOutputType = sageMessage.args.removeAndReturnDiceOutputType();
	const dicePostType = sageMessage.args.removeAndReturnDicePostType();
	const diceSecretMethodType = sageMessage.args.removeAndReturnDiceSecretMethodType();

	const name = sageMessage.args.removeAndReturnName();
	if (!name) {
		return sageMessage.reactFailure();
	}

	const added = await sageMessage.server.addGame(sageMessage.channelDid, name, gameType, critMethodType, diceOutputType, dicePostType, diceSecretMethodType);
	return sageMessage.reactSuccessOrFailure(added);
}

async function gameUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	// TODO: consider allowing updating games by messaging bot directly

	const gameType = sageMessage.args.removeAndReturnGameType();
	const critMethodType = sageMessage.args.removeAndReturnCritMethodType();
	const diceOutputType = sageMessage.args.removeAndReturnDiceOutputType();
	const dicePostType = sageMessage.args.removeAndReturnDicePostType();
	const diceSecretMethodType = sageMessage.args.removeAndReturnDiceSecretMethodType();
	const names = sageMessage.args.removeAndReturnNames();
	const name = names.newName ?? names.name ?? null;

	if (!name && gameType === undefined && critMethodType === undefined && diceOutputType === undefined && dicePostType === undefined && diceSecretMethodType === undefined) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.game!.update(name, gameType, critMethodType, diceOutputType, dicePostType, diceSecretMethodType);
	return sageMessage.reactSuccessOrFailure(updated);
}

async function gameArchive(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	// TODO: consider allowing removing games by messaging bot directly

	await gameDetails(sageMessage);
	const archive = await discordPromptYesNo(sageMessage, `Archive Game?`);
	if (archive) {
		const archived = await sageMessage.game!.archive();
		return sageMessage.reactSuccessOrFailure(archived);
	}
	return Promise.resolve();
}

export default function register(): void {
	registerAdminCommand(gameCount, "game-count");
	registerAdminCommandHelp("Admin", "Game", "game count");

	registerAdminCommand(myGameList, "my-games");

	registerAdminCommand(gameList, "game-list", "games-list", "game-archive-list", "games-archive-list");
	registerAdminCommandHelp("Admin", "Game", "game archive list");
	registerAdminCommandHelp("Admin", "Game", "game list");

	registerAdminCommand(gameDetails, "game-details");
	registerAdminCommandHelp("Admin", "Game", "game details");
	registerAdminCommandHelp("Admin", "SuperUser", "Game", "game details {UUID}");

	registerAdminCommand(gameCreate, "game-create", "game-add", "game-new");
	// registerAdminCommandHelp("Admin", "Game", "game create {Game Name} {(Optional Acronym)}");
	// registerAdminCommandHelp("Admin", "Game", "game create {Game Name} {#OptionalChannelReferences}");
	// registerAdminCommandHelp("Admin", "Game", "game create {Game Name} {@GameMasterReference} {@OptionalPlayerReferences}");
	registerAdminCommandHelp("Admin", "Game", `game create name="{Game Name}"`);
	registerAdminCommandHelp("Admin", "Game", `game create name="{Game Name}" game={PF2E|NONE}`);

	registerAdminCommand(gameUpdate, "game-update", "game-set");
	registerAdminCommandHelp("Admin", "Game", `game update name="{New Name}"`);
	registerAdminCommandHelp("Admin", "Game", "game update game={PF2E|NONE}");
	registerAdminCommandHelp("Admin", "Game", "game update diceoutput={XXS|XS|S|M|L|XL|XXL|UNSET}");

	registerAdminCommand(gameArchive, "game-archive");
	registerAdminCommandHelp("Admin", "Game", "game archive");
}
