import type { Optional } from "@rsc-utils/type-utils";
import { isNonNilUuid, randomUuid } from "@rsc-utils/uuid-utils";
import type { Snowflake, TextChannel } from "discord.js";
import { GameType } from "../../../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice";
import utils from "../../../../../sage-utils";
import { toHumanReadable } from "../../../../../sage-utils/utils/DiscordUtils/toHumanReadable";
import { DiscordId } from "../../../../discord";
import { discordPromptYesNo } from "../../../../discord/prompts";
import Game, { GameRoleType, GameUserType, IGameUser, mapSageChannelNameTags, nameTagsToType } from "../../../model/Game";
import GameCharacter from "../../../model/GameCharacter";
import type SageMessage from "../../../model/SageMessage";
import type Server from "../../../model/Server";
import { DialogType, IChannel, PermissionType } from "../../../repo/base/IdRepository";
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
		const gameId = sageMessage.args.find(isNonNilUuid);
		if (gameId) {
			game = await sageMessage.caches.games.getById(gameId);
		}
		if (!game) {
			await sageMessage.message.reply("*No Game Found!*");
		}
	}
	if (!sageMessage.canAdminGames && !game?.hasGameMaster(sageMessage.authorDid)) {
		await sageMessage.message.reply("*Server Admin, Game Admin, or Game Master privilege required!*");
	}
	return game ?? null;
}

function showGameRenderGameType(renderableContent: utils.RenderUtils.RenderableContent, game: Game): void {
	const inheritedGameType = game.gameType ?? game.server.defaultGameType ?? GameType.None;
	const gameType = GameType[game.gameType!] ?? `<i>inherited (${GameType[inheritedGameType]})</i>`;
	renderableContent.append(`<b>GameType</b> ${gameType}`);
}

async function showGameRenderDialogType(renderableContent: utils.RenderUtils.RenderableContent, sageMessage: SageMessage, game: Game): Promise<void> {
	const inheritedDialogType = game.defaultDialogType ?? game.server.defaultDialogType ?? DialogType.Embed;
	const dialogType = DialogType[game.defaultDialogType!] ?? `<i>inherited (${DialogType[inheritedDialogType]})</i>`;
	renderableContent.append(`<b>DialogType</b> ${dialogType}`);

	// Check for users with .Post as their default
	if (inheritedDialogType !== DialogType.Post) {
		let showAlert = false;
		for (const gameUser of game.users) {
			const user = await sageMessage.caches.users.getByDid(gameUser.did);
			if (user?.defaultDialogType === DialogType.Post) {
				showAlert = true;
				break;
			}
		}
		if (showAlert) {
			renderableContent.append(`[command-warn] <u>At least 1 user prefers Dialog via Post vs. Embed!</u> [command-warn]`);
		}
	}
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
	if (sageMessage.game && game !== sageMessage.game && sageMessage.isSuperUser) {
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

async function showGameRenderChannels(renderableContent: utils.RenderUtils.RenderableContent, sageMessage: SageMessage, game: Game): Promise<void> {
	renderableContent.append(`<b>Channels</b> ${game.channels.length}`);

	const tags = ["ic", "ooc", "gm", "misc"];
	for (const tag of tags) {
		const metas = game.channels
			.map(sageChannel => ({ sageChannel, nameTags:mapSageChannelNameTags(sageChannel) }))
			.filter(ch => ch.nameTags[tag as "ic"]);
		if (metas.length) {
			renderableContent.append(`[spacer]<b>${nameTagsToType(metas[0].nameTags)}</b>`);
			for (const meta of metas) {
				const guildChannel = await sageMessage.discord.fetchChannel<TextChannel>(meta.sageChannel.did);
				const guildChannelName = guildChannel ? `#${guildChannel.name}` : `<i>unavailable</i>`;
				renderableContent.append(`[spacer][spacer]${guildChannelName}`);
			}
		}
	}

	const orphanChannels = (await game.orphanChannels()).map(channel => channel ? `#${channel.did}` : `<i>unavailable</i>`);
	if (orphanChannels.length) {
		renderableContent.append(`<b>Orphaned Channels</b> ${orphanChannels.length}; ${orphanChannels.join(", ")}`);
	}
}

async function gameDetails(sageMessage: SageMessage, skipPrune = false, _game?: Game): Promise<void> {
	const game = _game ?? await showGameGetGame(sageMessage);
	if (!game) {
		return Promise.resolve();
	}

	const renderableContent = createAdminRenderableContent(game);

	renderableContent.setTitle(`<b>${game.name}</b>`);
	renderableContent.append(game.id);

	renderableContent.append(`<b>Created</b> ${formatDateTime(game.createdDate)}`);
	if (game.archivedDate) {
		renderableContent.append(`[spacer]<b>Archived</b> ${formatDateTime(game.archivedDate) ?? "<i>Active</i>"}`);
	}

	showGameRenderGameType(renderableContent, game);

	await showGameRenderChannels(renderableContent, sageMessage, game);

	const guildRoles = await game.guildRoles();
	const roles = guildRoles.map(guildRole => guildRole ? `@${guildRole.name} (${GameRoleType[game.roles.find(role => role.did === guildRole.id)?.type!]})` : `<i>unavailable</i>`);
	renderableContent.append(`<b>Roles</b> ${roles.length}; ${roles.join(", ")}`);

	const gmGuildMembers = await game.gmGuildMembers();
	const gameMasters = gmGuildMembers.map((gmGuildMember, index) => gmGuildMember ? toHumanReadable(gmGuildMember) : `<i>${game.gameMasters[index]}</i>`);
	renderableContent.append(`<b>Game Master Name</b>`, `[spacer]${game.gmCharacterName ?? `<i>inherited (${game.server.defaultGmCharacterName ?? GameCharacter.defaultGmCharacterName})</i>`}`);
	renderableContent.append(`<b>Game Masters</b> ${gameMasters.length}`);
	gameMasters.forEach(gm => renderableContent.append(`[spacer]${gm}`));

	renderableContent.append(`<b>NonPlayer Characters</b> ${game.nonPlayerCharacters.length}`);

	const playerGuildMembers = await game.pGuildMembers();
	const players = playerGuildMembers.map((pGuildMember, index) => pGuildMember ? toHumanReadable(pGuildMember) : `<i>${game.players[index]}</i>`);
	const playerCharacters = playerGuildMembers.map(pGuildMember => game.playerCharacters.findByUser(pGuildMember?.id)?.name).map(name => name ? ` (${name})` : ``);
	renderableContent.append(`<b>Players (Characters)</b> ${players.length}`);
	players.forEach((player, index) => renderableContent.append(`[spacer]${player}${playerCharacters[index]}`));

	const orphanUsers = (await game.orphanUsers()).map(user => user ? `@${user.did}` : `<i>unavailable</i>`);
	if (orphanUsers.length) {
		renderableContent.append(`<b>Orphaned Users</b> ${orphanUsers.length}; ${orphanUsers.join(", ")}`);
	}

	const orphanPCs = game.orphanedPlayerCharacters;
	if (orphanPCs.length) {
		renderableContent.append(`<b>Orphaned Player Characters</b> ${orphanPCs.length}`);
		orphanPCs.forEach(pc => renderableContent.append(`[spacer]${pc.name}`));
	}

	await showGameRenderDialogType(renderableContent, sageMessage, game);
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

type TGameDefaults = {
	gameType?: GameType;
	defaultCritMethodType?: CritMethodType;
	defaultDialogType?: DialogType;
	defaultDiceOutputType?: DiceOutputType;
	defaultDicePostType?: DicePostType;
	defaultDiceSecretMethodType?: DiceSecretMethodType;
};
function getServerValues(server: Server): TGameDefaults {
	const { defaultGameType, defaultCritMethodType, defaultDialogType, defaultDiceOutputType, defaultDicePostType, defaultDiceSecretMethodType } = server;
	return { gameType: defaultGameType, defaultCritMethodType, defaultDialogType, defaultDiceOutputType, defaultDicePostType, defaultDiceSecretMethodType };
}
function getArgValues(sageMessage: SageMessage): TGameDefaults {
	const gameType = sageMessage.args.removeAndReturnGameType() ?? undefined;
	const defaultCritMethodType = sageMessage.args.removeAndReturnCritMethodType() ?? undefined;
	const defaultDialogType = sageMessage.args.removeAndReturnDialogType() ?? undefined;
	const defaultDiceOutputType = sageMessage.args.removeAndReturnDiceOutputType() ?? undefined;
	const defaultDicePostType = sageMessage.args.removeAndReturnDicePostType() ?? undefined;
	const defaultDiceSecretMethodType = sageMessage.args.removeAndReturnDiceSecretMethodType() ?? undefined;
	return { gameType, defaultCritMethodType, defaultDialogType, defaultDiceOutputType, defaultDicePostType, defaultDiceSecretMethodType };
}
function getGameValues(sageMessage: SageMessage): TGameDefaults {
	const def = getServerValues(sageMessage.server);
	const arg = getArgValues(sageMessage);

	const gameType = arg.gameType ?? def.gameType;
	const defaultCritMethodType = arg.defaultCritMethodType ?? def.defaultCritMethodType;
	const defaultDialogType = arg.defaultDialogType ?? def.defaultDialogType;
	const defaultDiceOutputType = arg.defaultDiceOutputType ?? def.defaultDiceOutputType;
	const defaultDicePostType = arg.defaultDicePostType ?? def.defaultDicePostType;
	const defaultDiceSecretMethodType = arg.defaultDiceSecretMethodType ?? def.defaultDiceSecretMethodType;

	return { gameType, defaultCritMethodType, defaultDialogType, defaultDiceOutputType, defaultDicePostType, defaultDiceSecretMethodType };
}
function channelArgToDid(arg: string | undefined | null): Snowflake | undefined {
	if (arg) {
		if (DiscordId.isChannelReference(arg)) return DiscordId.parseId(arg);
		if (DiscordId.isChannelLink(arg)) return DiscordId.from(arg)?.did;
	}
	return undefined;
}
function getGameChannels(sageMessage: SageMessage): IChannel[] {
	const channels: IChannel[] = [];

	const ic = sageMessage.args.removeKeyValuePair("ic")?.value;
	const icDid = channelArgToDid(ic);
	if (icDid) {
		channels.push({ did:icDid, admin:true, dialog:true, dice:true, gameMaster:PermissionType.Write, player:PermissionType.Write });
	}

	const ooc = sageMessage.args.removeKeyValuePair("ooc")?.value;
	const oocDid = channelArgToDid(ooc);
	if (oocDid) {
		channels.push({ did:oocDid, admin:true, commands:true, dialog:true, dice:true, search:true, gameMaster:PermissionType.Write, player:PermissionType.Write });
	}

	if (!channels.length) {
		channels.push({ did:sageMessage.channelDid!, admin:true, commands:true, dialog:true, dice:true, search:true, gameMaster:PermissionType.Write, player:PermissionType.Write });
	}

	return channels;
}
async function getGameUsers(sageMessage: SageMessage): Promise<IGameUser[]> {
	const users: IGameUser[] = [];

	const gm = sageMessage.args.removeKeyValuePair("gm")?.value;
	if (gm && DiscordId.isUserMention(gm)) {
		users.push({ did:DiscordId.parseId(gm), type:GameUserType.GameMaster, dicePing:true });
	}

	const role = sageMessage.args.removeKeyValuePair(/(players|table|role)/i)?.value;
	if (role && DiscordId.isRoleMention(role)) {
		const roleDid = DiscordId.parseId(role);
		const guildRole = await sageMessage.discord.fetchGuildRole(roleDid);
		if (guildRole) {
			guildRole.members.forEach(guildMember => {
				if (!users.find(user => user.did === guildMember.id)) {
					users.push({ did:guildMember.id, type:GameUserType.Player, dicePing:true });
				}
			});
		}
	}

	return users;
}
function createGame(sageMessage: SageMessage, name: string, gameValues: TGameDefaults, channels: IChannel[], users: IGameUser[]): Game {
	return new Game({
		objectType: "Game",
		id: randomUuid(),
		serverDid: sageMessage.server.did,
		serverId: sageMessage.server.id,
		createdTs: new Date().getTime(),
		name: name,
		channels: channels,
		colors: sageMessage.server.colors.toArray(),
		users,
		...gameValues,
	}, sageMessage.server, sageMessage.caches);
}

async function gameCreate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGames || !sageMessage.channelDid) {
		return sageMessage.reactBlock();
	}

	if (sageMessage.game) {
		return sageMessage.reactFailure();
	}

	const name = sageMessage.args.removeAndReturnName();
	const gameValues = getGameValues(sageMessage);
	const gameChannels = getGameChannels(sageMessage);
	const gameUsers = await getGameUsers(sageMessage);

	const hasName = !!name;
	const hasValues = !!Object.keys(gameValues).find(key => (gameValues as any)[key] !== undefined);
	const hasChannel = !!gameChannels.length;
	if (!hasName || !hasValues || !hasChannel) {
		await sageMessage.message.reply({ content:"Please try:\n`sage!!game create name=\"GAME NAME\" type=\"PF2E\" ic=\"#IN_CHARACTER_CHANNEL\" ooc=\"OUT_OF_CHARACTER_CHANNEL\" gm=\"@GM_MENTION\" players=\"@PLAYER_ROLE_MENTION\"`" });
		return sageMessage.reactFailure();
	}

	const game = createGame(sageMessage, name, gameValues, gameChannels, gameUsers);
	await gameDetails(sageMessage, true, game);
	const create = await discordPromptYesNo(sageMessage, `Create Game?`);

	if (create) {
		const gameSaved = game ? await game.save() : false;
		const serverSaved = gameSaved ? await sageMessage.server.save() : false;

		const added = gameSaved && serverSaved;
		await sageMessage.message.channel.send({ content:added ? "Game Created." : "Unknown Error; Game NOT Created!" });
		return sageMessage.reactSuccessOrFailure(added);
	}
}

async function gameUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	// TODO: consider allowing updating games by messaging bot directly

	const gameType = sageMessage.args.removeAndReturnGameType();
	const critMethodType = sageMessage.args.removeAndReturnCritMethodType();
	const dialogType = sageMessage.args.removeAndReturnDialogType();
	const diceOutputType = sageMessage.args.removeAndReturnDiceOutputType();
	const dicePostType = sageMessage.args.removeAndReturnDicePostType();
	const diceSecretMethodType = sageMessage.args.removeAndReturnDiceSecretMethodType();
	const names = sageMessage.args.removeAndReturnNames();
	const name = names.newName ?? names.name ?? null;

	if (!name && gameType === undefined && dialogType === undefined && critMethodType === undefined && diceOutputType === undefined && dicePostType === undefined && diceSecretMethodType === undefined) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.game!.update(name, gameType, dialogType, critMethodType, diceOutputType, dicePostType, diceSecretMethodType);
	if (updated) {
		return gameDetails(sageMessage, true, sageMessage.game);
	}
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

async function gameToggleDicePing(sageMessage: SageMessage): Promise<void> {
	const gameChannel = sageMessage.gameChannel;
	if (gameChannel?.admin && (sageMessage.isGameMaster || sageMessage.isPlayer)) {
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
	registerAdminCommandHelp("Admin", "Game", `game create name="{Game Name}" game={DND5E|E20|PF2E|Quest|VtM5e|NONE}`);

	registerAdminCommand(gameUpdate, "game-update", "game-set");
	registerAdminCommandHelp("Admin", "Game", `game update name="{New Name}"`);
	registerAdminCommandHelp("Admin", "Game", "game update game={DND5E|E20|PF2E|Quest|VtM5e|NONE}");
	registerAdminCommandHelp("Admin", "Game", "game update diceoutput={XXS|XS|S|M|L|XL|XXL|ROLLEM|UNSET}");

	registerAdminCommand(gameToggleDicePing, "game-toggle-dice-ping");
	registerAdminCommandHelp("Admin", "Game", `game toggle dice ping`);

	registerAdminCommand(gameArchive, "game-archive");
	registerAdminCommandHelp("Admin", "Game", "game archive");
}
