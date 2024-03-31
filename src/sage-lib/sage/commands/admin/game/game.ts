import { DialogPostType, DiceCritMethodType, DiceOutputType, DicePostType, DiceSecretMethodType, GameSystemType, SageChannelType, type SageChannel } from "@rsc-sage/types";
import { sortComparable } from "@rsc-utils/array-utils";
import { debug } from "@rsc-utils/console-utils";
import { getDateStrings } from "@rsc-utils/date-utils";
import { DiscordKey, toChannelMention, toHumanReadable } from "@rsc-utils/discord-utils";
import { applyChanges, isEmpty } from "@rsc-utils/json-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import type { Args, Optional } from "@rsc-utils/type-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import type { TextChannel } from "discord.js";
import { registerInteractionListener } from "../../../../discord/handlers.js";
import { discordPromptYesNo } from "../../../../discord/prompts.js";
import { resolveToEmbeds } from "../../../../discord/resolvers/resolveToEmbeds.js";
import { Game, GameOptions, GameRoleType, GameUserType, mapSageChannelNameTags, nameTagsToType, type IGameUser } from "../../../model/Game.js";
import { GameCharacter } from "../../../model/GameCharacter.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import { SageInteraction } from "../../../model/SageInteraction.js";
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

async function showGameGetGame(sageCommand: SageCommand): Promise<Game | null> {
	let game: Optional<Game> = sageCommand.game;
	if (!game) {
		const gameId = sageCommand.args.getUuid("id");
		if (gameId) {
			game = await sageCommand.sageCache.games.getById(gameId);
		}
		if (!game) {
			await sageCommand.reply("*No Game Found!*");
		}
	}
	if (!sageCommand.canAdminGames && !game?.hasGameMaster(sageCommand.authorDid)) {
		await sageCommand.reply("*Server Admin, Game Admin, or Game Master privilege required!*");
	}
	return game ?? null;
}

function showGameRenderGameType(renderableContent: RenderableContent, game: Game): void {
	if (game.gameSystem) {
		renderableContent.append(`<b>Game System</b> ${game.gameSystem.name}`);
	}else if (game.server.gameSystem) {
		renderableContent.append(`<b>Game System</b> <i>inherited (${game.server.gameSystem.name})</i>`);
	}else {
		renderableContent.append(`<b>Game System</b> <i>inherited (None)</i>`);
	}
}

async function showGameRenderDialogType(renderableContent: RenderableContent, sageCommand: SageCommand, game: Game): Promise<void> {
	const labels = ["Embed", "Post"];
	const inheritedDialogType = game.dialogPostType ?? game.server.dialogPostType ?? DialogPostType.Embed;
	const dialogType = labels[game.dialogPostType!] ?? `<i>inherited (${labels[inheritedDialogType]})</i>`;
	renderableContent.append(`<b>Dialog Post Type</b> ${dialogType}`);

	// Check for users with .Post as their default
	if (inheritedDialogType !== DialogPostType.Post) {
		let showAlert = false;
		for (const gameUser of game.users) {
			const user = await sageCommand.sageCache.users.getByDid(gameUser.did);
			if (user?.dialogPostType === DialogPostType.Post) {
				showAlert = true;
				break;
			}
		}
		if (showAlert) {
			renderableContent.append(`[command-warn] <u>At least 1 user prefers Dialog via Post vs. Embed!</u> [command-warn]`);
		}
	}
}

function gameDetailsAppendDice(renderableContent: RenderableContent, game: Game): void {
	const server = game.server;
	renderableContent.append(`<b>Default Dice Options</b>`);

	if (game.gameSystemType === GameSystemType.PF2e) {
		const diceCritMethodType: keyof typeof DiceCritMethodType | undefined = <keyof typeof DiceCritMethodType>DiceCritMethodType[game.diceCritMethodType!];
		const inheritedDiceCritMethodType = DiceCritMethodType[server.diceCritMethodType ?? DiceCritMethodType.TimesTwo];
		renderableContent.append(`[spacer]<b>Crit Math</b> ${diceCritMethodType ?? `<i>inherited (${inheritedDiceCritMethodType})</i>`}`);
	} else {
		renderableContent.append(`[spacer]<b>Crit Math</b> <i>currently only available for PF2e</i>`);
	}

	const diceOutputType: keyof typeof DiceOutputType | undefined = <keyof typeof DiceOutputType>DiceOutputType[game.diceOutputType!];
	const inheritedDiceOutputType = DiceOutputType[server.diceOutputType ?? DiceOutputType.M];
	renderableContent.append(`[spacer]<b>Output Format</b> ${diceOutputType ?? `<i>inherited (${inheritedDiceOutputType})</i>`}`);

	const dicePostType = DicePostType[game.dicePostType!];
	const inheritedDicePostType = DicePostType[server.dicePostType ?? DicePostType.SinglePost];
	renderableContent.append(`[spacer]<b>Post Style</b> ${dicePostType ?? `<i>inherited (${inheritedDicePostType})</i>`}`);

	const diceSecretMethodType: keyof typeof DiceSecretMethodType | undefined = <keyof typeof DiceSecretMethodType>DiceSecretMethodType[game.diceSecretMethodType!];
	const inheritedDiceSecretMethodType = DiceSecretMethodType[server.diceSecretMethodType ?? DiceSecretMethodType.Ignore];
	renderableContent.append(`[spacer]<b>Secret Checks</b> ${diceSecretMethodType ?? `<i>inherited (${inheritedDiceSecretMethodType})</i>`}`);
}

async function showGameRenderServer(renderableContent: RenderableContent, sageCommand: SageCommand, game: Game): Promise<void> {
	if (sageCommand.game && game !== sageCommand.game && sageCommand.isSuperUser) {
		renderableContent.appendTitledSection("<b>Server</b>", game.serverDid, game.serverId);
		const guild = await sageCommand.discord.fetchGuild(game.serverDid);
		if (guild) {
			renderableContent.append(`<b>Name</b> ${guild.name}`);
			renderableContent.append(`<b>Available</b> ${guild.available}`);
		} else {
			renderableContent.append(`${"<i>NOT FOUND!</i>"}`);
		}
	}
}

async function showGameRenderChannels(renderableContent: RenderableContent, sageCommand: SageCommand, game: Game): Promise<void> {
	renderableContent.append(`<b>Channels</b> ${game.channels.length}`);

	const tags = ["ic", "ooc", "gm", "misc"];
	for (const tag of tags) {
		const metas = game.channels
			.map(sageChannel => ({ sageChannel, nameTags:mapSageChannelNameTags(sageChannel) }))
			.filter(ch => ch.nameTags[tag as "ic"]);
		if (metas.length) {
			renderableContent.append(`[spacer]<b>${nameTagsToType(metas[0].nameTags)}</b>`);
			for (const meta of metas) {
				const guildChannel = await sageCommand.discord.fetchChannel<TextChannel>(meta.sageChannel.id);
				const guildChannelName = guildChannel ? `#${guildChannel.name}` : `<i>unavailable</i>`;
				renderableContent.append(`[spacer][spacer]${guildChannelName}`);
			}
		}
	}
}

async function gameDetails(sageCommand: SageCommand, skipPrune = false, _game?: Game): Promise<void> {
	const game = _game ?? await showGameGetGame(sageCommand);
	if (!game) {
		return Promise.resolve();
	}

	const renderableContent = createAdminRenderableContent(game);

	renderableContent.setTitle(`<b>${game.name}</b>`);
	renderableContent.append(game.id);

	renderableContent.append(`<b>Created</b> ${getDateStrings(game.createdDate).dateTime}`);
	if (game.archivedDate) {
		renderableContent.append(`[spacer]<b>Archived</b> ${getDateStrings(game.archivedDate).dateTime}`);
	}

	showGameRenderGameType(renderableContent, game);

	await showGameRenderChannels(renderableContent, sageCommand, game);

	const orphanChannels = await game.orphanChannels();
	if (orphanChannels.length) {
		const orphanChannelIds = orphanChannels.map(channel => `#${channel.id}`);
		renderableContent.append(`<b>Orphaned Channels</b> ${orphanChannelIds.length}; ${orphanChannelIds.join(", ")}`);
	}

	const guildRoles = await game.guildRoles();
	const roles = guildRoles.map(guildRole => guildRole ? `@${guildRole.name} (${GameRoleType[game.roles.find(role => role.did === guildRole.id)?.type!]})` : `<i>unavailable</i>`);
	renderableContent.append(`<b>Roles</b> ${roles.length}; ${roles.join(", ")}`);

	const gmGuildMembers = await game.gmGuildMembers();
	const gameMasters = gmGuildMembers.map((gmGuildMember, index) => gmGuildMember ? toHumanReadable(gmGuildMember) : `<i>${game.gameMasters[index]}</i>`);
	renderableContent.append(`<b>Game Master Name</b>`, `[spacer]${game.gmCharacterName ?? `<i>inherited (${game.server.gmCharacterName ?? GameCharacter.defaultGmCharacterName})</i>`}`);
	renderableContent.append(`<b>Game Masters</b> ${gameMasters.length}`);
	gameMasters.forEach(gm => renderableContent.append(`[spacer]${gm}`));

	renderableContent.append(`<b>NonPlayer Characters</b> ${game.nonPlayerCharacters.length}`);

	const playerGuildMembers = await game.pGuildMembers();
	const players = playerGuildMembers.map((pGuildMember, index) => pGuildMember ? toHumanReadable(pGuildMember) : `<i>${game.players[index]}</i>`);
	const playerCharacters = playerGuildMembers.map(pGuildMember => game.playerCharacters.findByUser(pGuildMember?.id)?.name).map(name => name ? ` (${name})` : ``);
	renderableContent.append(`<b>Players (Characters)</b> ${players.length}`);
	players.forEach((player, index) => renderableContent.append(`[spacer]${player}${playerCharacters[index]}`));

	const orphanUsers = await game.orphanUsers();
	if (orphanUsers.length) {
		const orphanUserIds = orphanUsers.map(user => `@${user.did}`);
		renderableContent.append(`<b>Orphaned Users</b> ${orphanUserIds.length}; ${orphanUserIds.join(", ")}`);
	}

	const orphanPCs = game.orphanedPlayerCharacters;
	if (orphanPCs.length) {
		renderableContent.append(`<b>Orphaned Player Characters</b> ${orphanPCs.length}`);
		orphanPCs.forEach(pc => renderableContent.append(`[spacer]${pc.name}`));
	}

	await showGameRenderDialogType(renderableContent, sageCommand, game);
	gameDetailsAppendDice(renderableContent, game);
	await showGameRenderServer(renderableContent, sageCommand, game);
	// await sageMessage.send(renderableContent);
	await sageCommand.dChannel?.send({embeds:resolveToEmbeds(sageCommand.sageCache, renderableContent)});

	if (sageCommand.server && !skipPrune) {
		const missingPlayerSnowflakes = orphanUsers.filter(user => game.hasPlayer(user.did)).map(user => user.did);
		const missingPlayers = missingPlayerSnowflakes.length > 0;

		const missingGmSnowflakes = orphanUsers.filter(user => game.hasGameMaster(user.did)).map(user => user.did);
		const missingGms = missingGmSnowflakes.length > 0;

		const missingChannelSnowflakes = orphanChannels.map(channel => channel.id);
		const missingChannels = missingChannelSnowflakes.length > 0;

		if (missingPlayers || missingGms || missingChannels) {
			const message = [
				missingPlayers ? `${missingPlayerSnowflakes.length} player(s) left the server.` : ``,
				missingGms ? `${missingGmSnowflakes.length} game master(s) left the server.` : ``,
				missingChannels ? `${missingChannelSnowflakes.length} channel(s) have been deleted.` : ``,
				`Remove them from the game?`
			].filter(s => s).join("\n");

			const remove = await discordPromptYesNo(sageCommand, message);
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
				if (missingChannels) {
					const removed = await game.removeChannels(...missingChannelSnowflakes);
					if (removed) {
						showAgain = true;
					}else {
						unable.push(`<i>Unable to remove channel(s)!</i>`);
					}
				}
				if (showAgain) {
					await gameDetails(sageCommand, true);
				}
			}
		}

	}
}

function getServerValues(server: Server): Partial<GameOptions> {
	const { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName } = server;
	return { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName };
}

function getArgValues(sageCommand: SageCommand): Args<GameOptions> {
	/** @todo redo args to be a mixin and use getgameoptions from sagemessageargs */
	const dialogPostType = sageCommand.args.getEnum(DialogPostType, "dialogType");
	const diceCritMethodType = sageCommand.args.getEnum(DiceCritMethodType, "diceCrit");
	const diceOutputType = sageCommand.args.getEnum(DiceOutputType, "diceOutput");
	const dicePostType = sageCommand.args.getEnum(DicePostType, "dicePost");
	const diceSecretMethodType = sageCommand.args.getEnum(DiceSecretMethodType, "diceSecret");
	const gameSystemType = sageCommand.args.getEnum(GameSystemType, "system");
	const gmCharacterName = sageCommand.args.getString("gmName");
	debug({ dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName });
	return { dialogPostType, diceCritMethodType, diceOutputType, dicePostType, diceSecretMethodType, gameSystemType, gmCharacterName };
}

function getGameValues(sageCommand: SageCommand): Partial<GameOptions> {
	// get base/defaults
	const options = getServerValues(sageCommand.server);
	// get argument values
	const argOptions = getArgValues(sageCommand);
	// apply argument values to defaults
	applyChanges(options, argOptions);
	// return final options
	return options;
}

function getGameChannels(sageCommand: SageCommand): SageChannel[] {
	const channels: SageChannel[] = [];

	const icIds = sageCommand.args.getChannelIds("ic");
	icIds.forEach(id => channels.push({ id, type:SageChannelType.InCharacter }));

	const oocIds = sageCommand.args.getChannelIds("ooc");
	oocIds.forEach(id => channels.push({ id, type:SageChannelType.OutOfCharacter }));

	const gmIds = sageCommand.args.getChannelIds("gm");
	gmIds.forEach(id => channels.push({ id, type:SageChannelType.GameMaster }));

	const diceIds = sageCommand.args.getChannelIds("dice");
	diceIds.forEach(id => channels.push({ id, type:SageChannelType.Dice }));

	if (!channels.length && sageCommand.channelDid) {
		channels.push({ id:sageCommand.channelDid, type:SageChannelType.OutOfCharacter });
	}

	return channels;
}

async function getGameUsers(sageCommand: SageCommand): Promise<IGameUser[]> {
	const users: IGameUser[] = [];

	// do both "gm" and "gms" in case a posted command has the old gm= for the GM and not for the GM Channel
	const gmIds = await sageCommand.args.getUserIds("gm", true);
	gmIds.forEach(did => users.push({ did, type:GameUserType.GameMaster, dicePing:true }));
	const gmsIds = await sageCommand.args.getUserIds("gms", true);
	gmsIds.forEach(did => users.push({ did, type:GameUserType.GameMaster, dicePing:true }));

	const playerIds = await sageCommand.args.getUserIds("players", true);
	playerIds.forEach(did => users.push({ did, type:GameUserType.Player, dicePing:true }));

	return users;
}

function createGame(sageCommand: SageCommand, name: string, gameValues: Partial<GameOptions>, channels: SageChannel[], users: IGameUser[]): Game {
	return new Game({
		objectType: "Game",
		id: randomUuid(),
		serverDid: sageCommand.server.did,
		serverId: sageCommand.server.id,
		createdTs: new Date().getTime(),
		channels: channels,
		colors: sageCommand.server.colors.toArray(),
		users,
		...gameValues,
		name,
	}, sageCommand.server, sageCommand.sageCache);
}

async function postGameCreate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGames) {
		return sageMessage.reactBlock("Sorry, You aren't allowed to create Games.");
	}

	const updated = await gameCreate(sageMessage);
	if (updated === true) {
		await sageMessage.reactSuccess("Game Created.");

	}else if (updated === false) {
		await sageMessage.reactFailure("Unknown Error; Game NOT Created!");

	}else if (updated === null) {
		await sageMessage.reactFailure("Please try:\n`sage!!game create name=\"GAME NAME\" type=\"PF2E\" ic=\"#IN_CHARACTER_CHANNEL\" ooc=\"OUT_OF_CHARACTER_CHANNEL\" gms=\"@GM_MENTION\" players=\"@PLAYER_ROLE_MENTION\"`");

	}else if (updated === undefined) {
		// do nothing

	}
}

async function slashGameCreate(sageInteraction: SageInteraction): Promise<void> {
	sageInteraction.defer(true);

	const updated = await gameCreate(sageInteraction);
	if (updated === true) {
		await sageInteraction.whisper({ content:"Game Created." });

	}else if (updated === false) {
		await sageInteraction.whisper({ content:"Unknown Error; Game NOT Created!" });

	}else if (updated === null) {
		await sageInteraction.whisper({ content:"Please try:\n`sage!!game create name=\"GAME NAME\" type=\"PF2E\" ic=\"#IN_CHARACTER_CHANNEL\" ooc=\"OUT_OF_CHARACTER_CHANNEL\" gm=\"@GM_MENTION\" players=\"@PLAYER_ROLE_MENTION\"`" });

	}else if (updated === undefined) {
		// do nothing
	}

}
async function gameCreate(sageCommand: SageCommand): Promise<boolean | undefined | null> {
	const server = sageCommand.server;
	const name = sageCommand.args.getString("name");
	const gameValues = getGameValues(sageCommand);
	const gameChannels = getGameChannels(sageCommand);
	const gameUsers = await getGameUsers(sageCommand);

	const freeGameChannels: SageChannel[] = [];
	const usedGameChannels: SageChannel[] = [];
	for (const channel of gameChannels) {
		const discordKey = new DiscordKey(server.did, channel.id);
		const otherGame = await sageCommand.sageCache.games.findActiveByDiscordKey(discordKey);
		if (otherGame) {
			usedGameChannels.push(channel);
		}else {
			freeGameChannels.push(channel);
		}
	}
	if (usedGameChannels.length) {
		const channelLinks = usedGameChannels.map(channel => "\n- " + toChannelMention(channel.id));
		const channelist = channelLinks.join("");
		await sageCommand.whisper(`The following channels are already part of a game:` + channelist);
		return undefined;
	}

	const hasName = !!name;
	const hasValues = !isEmpty(gameValues);
	const hasChannel = !!freeGameChannels.length;
	if (!hasName || !hasValues || !hasChannel) {
		return null;
	}

	const game = createGame(sageCommand, name, gameValues, freeGameChannels, gameUsers);
	await gameDetails(sageCommand, true, game);
	const create = await discordPromptYesNo(sageCommand, `Create Game?`);

	if (create) {
		const gameSaved = game ? await game.save() : false;
		const serverSaved = gameSaved ? await sageCommand.server.save() : false;
		return gameSaved && serverSaved;
	}
	return undefined;
}

async function gameUpdate(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.canAdminGame) {
		return sageMessage.reactBlock();
	}

	// TODO: consider allowing updating games by messaging bot directly

	const gameOptions = sageMessage.args.getGameOptions();
	// gameOptions.name = sageMessage.args.getString("newName") ?? gameOptions?.name;

	if (!gameOptions) {
		return sageMessage.reactFailure();
	}

	const updated = await sageMessage.game!.update(gameOptions);
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

	registerAdminCommand(gameDetails, "game-details");
	registerAdminCommandHelp("Admin", "Game", "game details");

	registerAdminCommand(gameUpdate, "game-update", "game-set");
	registerAdminCommandHelp("Admin", "Game", `game update name="{New Name}"`);
	registerAdminCommandHelp("Admin", "Game", "game update game={DND5E|E20|PF2E|Quest|VtM5e|NONE}");
	registerAdminCommandHelp("Admin", "Game", "game update diceoutput={XXS|XS|S|M|L|XL|XXL|ROLLEM|UNSET}");

	registerAdminCommand(gameToggleDicePing, "game-toggle-dice-ping");
	registerAdminCommandHelp("Admin", "Game", `game toggle dice ping`);

	registerAdminCommand(gameArchive, "game-archive");
	registerAdminCommandHelp("Admin", "Game", "game archive");

	registerInteractionListener(cmd => cmd.isCommand("Game", "Create"), slashGameCreate);
	registerAdminCommand(postGameCreate, "game-create", "create-game");

}
