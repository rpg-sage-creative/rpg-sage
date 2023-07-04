import type { GuildMember, Role, Snowflake } from "discord.js";
import { GameType } from "../../../../../sage-common";
import { CritMethodType, DiceOutputType, DiceSecretMethodType } from "../../../../../sage-dice";
import type { Args, Optional } from "../../../../../sage-utils";
import { sortComparable } from "../../../../../sage-utils/ArrayUtils";
import type { DGuildChannel } from "../../../../../sage-utils/DiscordUtils";
import type { DiscordFetches } from "../../../../../sage-utils/DiscordUtils";
import { DiscordId } from "../../../../../sage-utils/DiscordUtils";
import { toSuperscript } from "../../../../../sage-utils/NumberUtils";
import type { RenderableContent } from "../../../../../sage-utils/RenderUtils";
import { generate, isValid } from "../../../../../sage-utils/UuidUtils";
import { discordPromptYesNo } from "../../../../discord/prompts";
import { Game,  GameRoleType, GameUserType, getDefaultGameOptions, IGameRole, IGameUser, TDefaultGameOptions } from "../../../model/Game";
import { GameCharacter } from "../../../model/GameCharacter";
import { getEnum, hasValues, ISageCommandArgs } from "../../../model/SageCommandArgs";
import type { SageMessage } from "../../../model/SageMessage";
import type { Server } from "../../../model/Server";
import { getServerDefaultGameOptions } from "../../../model/Server";
import { DialogType, GameChannelType, IChannel, toGameChannelTypeString } from "../../../repo/base/channel";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { DicePostType } from "../../dice";
import { registerAdminCommandHelp } from "../../help";

async function allGameCount(sageMessage: SageMessage): Promise<void> {
	const games = await sageMessage.sageCache.games.getAll();
	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>All Game Count</b>`);
	renderableContent.append(`<b>Active</b> ${games.filter(game => !game.isArchived).length}`);
	renderableContent.append(`<b>Archived</b> ${games.filter(game => game.isArchived).length}`);
	renderableContent.append(`<b>Total</b> ${games.length}`);
	await sageMessage.send(renderableContent);
}

async function gameCount(sageMessage: SageMessage): Promise<void> {
	if (!sageMessage.server && sageMessage.isSuperUser) return allGameCount(sageMessage);

	const denial = sageMessage.checkDenyAdminServer("Count Server Games");
	if (denial) {
		return denial;
	}

	const games = await sageMessage.sageCache.games.getByServerDid(sageMessage.guild!.did);
	const renderableContent = createAdminRenderableContent(sageMessage.bot, `<b>Server Game Count</b>`);
	renderableContent.append(`<b>Active</b> ${games.filter(game => !game.isArchived).length}`);
	renderableContent.append(`<b>Archived</b> ${games.filter(game => game.isArchived).length}`);
	renderableContent.append(`<b>Total</b> ${games.length}`);
	await sageMessage.send(renderableContent);
}

async function myGameList(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("My Game List");
	if (denial) {
		return denial;
	}

	const myDid = sageMessage.actor.did;
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
	renderableContent.setTitle(`<b>My Games</b>`);
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
				const isGM = await game.hasUser(myDid, GameRoleType.GameMaster);
				let channel: IChannel | undefined;

				renderableContent.append(`[spacer]<b>${game.name}</b>`);
				renderableContent.append(`[spacer][spacer]<b>Role</b> ${isGM ? "GameMaster" : "Player"}`);
				if (isGM) {
					channel = await game.findBestGameMasterChannel();
				} else {
					channel = await game.findBestPlayerChannel();
					const playerCharacters = await game.fetchPlayerCharacters();
					const myPC = playerCharacters.findByUser(myDid);
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
	const denial = sageMessage.checkDenyAdminGames("List Server Games");
	if (denial) {
		return denial;
	}

	let games = await sageMessage.sageCache.games.getByServerDid(sageMessage.guild!.did);
	if (!games) {
		return Promise.resolve();
	}

	const archived = sageMessage.command?.includes("archive") ?? false;
	games = games.filter(game => !!game.isArchived === archived);

	const filter = sageMessage.args.unkeyedValues().join(" ");
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
		const gameId = sageMessage.args.findBy(arg => isValid(arg.value))?.value;
		if (gameId) {
			game = await sageMessage.sageCache.games.getById(gameId);
		}
	}
	const denial = sageMessage.checkDenyAdminGame("Show Game Details");
	if (denial) {
		await denial;
		return null;
	}
	return game ?? null;
}

function showGameRenderGameType(renderableContent: RenderableContent, game: Game): void {
	const inheritedGameType = game.gameType ?? game.server.defaultGameType ?? GameType.None;
	const gameType = GameType[game.gameType!] ?? `<i>inherited (${GameType[inheritedGameType]})</i>`;
	renderableContent.append(`<b>GameType</b> ${gameType}`);
}

async function showGameRenderDialogType(renderableContent: RenderableContent, sageMessage: SageMessage, game: Game): Promise<void> {
	const inheritedDialogType = game.defaultDialogType ?? game.server.defaultDialogType ?? DialogType.Embed;
	const dialogType = DialogType[game.defaultDialogType!] ?? `<i>inherited (${DialogType[inheritedDialogType]})</i>`;
	renderableContent.append(`<b>DialogType</b> ${dialogType}`);

	// Check for users with .Post as their default
	if (inheritedDialogType !== DialogType.Post) {
		let showAlert = false;
		for (const gameUser of game.users) {
			const user = await sageMessage.sageCache.users.getByDid(gameUser.did);
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

function gameDetailsAppendDice(renderableContent: RenderableContent, game: Game): void {
	const server = game.server;
	renderableContent.append(`<b>Default Dice Options</b>`);

	if (game.gameType === GameType.PF2e || game.gameType === GameType.DnD5e) {
		const critMethodType: keyof typeof CritMethodType | undefined = <keyof typeof CritMethodType>CritMethodType[game.defaultCritMethodType!];
		const inheritedCritMethodType = CritMethodType[server.defaultCritMethodType ?? CritMethodType.TimesTwo];
		renderableContent.append(`[spacer]<b>Crit Math</b> ${critMethodType ?? `<i>inherited (${inheritedCritMethodType})</i>`}`);
	} else {
		renderableContent.append(`[spacer]<b>Crit Math</b> <i>currently only available for DnD5e or PF2e</i>`);
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

async function showGameRenderServer(renderableContent: RenderableContent, sageMessage: SageMessage, game: Game): Promise<void> {
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

async function showGameRenderChannels(renderableContent: RenderableContent, sageMessage: SageMessage, game: Game): Promise<void> {
	renderableContent.append(`<b>Channels</b> ${game.channels.length}`);

	const discord = await sageMessage.sageCache.discord.forGuild(game.serverDid);
	const gameChannels = game.channels;
	const allChannels = [] as { gameChannel:IChannel, guildChannel?:DGuildChannel }[];
	for (const gameChannel of gameChannels) {
		const guildChannel = await discord?.fetchChannel(gameChannel.did) ?? undefined;
		allChannels.push({ gameChannel, guildChannel })
	}

	const types = [GameChannelType.InCharacter, GameChannelType.OutOfCharacter, GameChannelType.GameMaster, GameChannelType.Dice, GameChannelType.Miscellaneous, GameChannelType.None];
	for (const type of types) {
		const channels = allChannels.filter(pair => pair.guildChannel && (pair.gameChannel.gameChannelType ?? GameChannelType.None) === type);
		if (channels.length) {
			const typeLabel = type === GameChannelType.None ? "Other" : toGameChannelTypeString(type);
			renderableContent.append(`[spacer]<b>${typeLabel}</b>`);
			channels.forEach(pair => renderableContent.append(`[spacer][spacer]#${pair.guildChannel!.name}`));
		}
	}

	const orphanChannels = allChannels.filter(pair => !pair.guildChannel);
	if (orphanChannels.length) {
		renderableContent.append(`<b>Orphaned Channels</b> ${orphanChannels.length}`);
		orphanChannels.forEach(pair => {
			const typeLabel = pair.gameChannel.gameChannelType === GameChannelType.None ? "Other" : toGameChannelTypeString(pair.gameChannel.gameChannelType);
			renderableContent.append(`[spacer]<b>${typeLabel}</b> <i>#${pair.gameChannel.did}</i>`);
		});
	}
}

type TMembersAndOrphans = {
	byRole: GuildMember[];
	byUser: GuildMember[];
	orphans: Snowflake[];
	members: GuildMember[];
	names: string[];
};
async function fetchMembersAndOrphans(discordFetches: DiscordFetches, userDids: Snowflake[], roleDid: Snowflake | undefined): Promise<TMembersAndOrphans> {
	const byUser = [] as GuildMember[];
	const orphans = [] as Snowflake[];
	for (const did of userDids) {
		const guildMember = await discordFetches.fetchGuildMember(did);
		if (guildMember) {
			byUser.push(guildMember);
		}else {
			orphans.push(did);
		}
	}

	const role = await discordFetches.fetchGuildRole(roleDid);
	const byRole = Array.from(role?.members.values() ?? []);

	const hasBoth = byUser.length > 0 && byRole.length > 0;

	const members = [] as GuildMember[];
	const names = [] as string[];
	byUser.forEach(member => {
		members.push(member);

		const name = member.user?.tag ?? member.displayName;
		let note = "";
		if (hasBoth) {
			const zero = toSuperscript(0);
			const one = byRole.find(m => member.id === m.id) ? toSuperscript(1) : "";
			note = zero + one;
		}
		names.push( `@${name}${note}`);
	});
	byRole.forEach(member => {
		if (!members.find(m => member.id === m.id)) {
			members.push(member);

			const name = member.user?.tag ?? member.displayName;
			const one = hasBoth ? toSuperscript(1) : "";
			names.push(`@${name}${one}`);
		}
	});

	return { byUser, orphans, byRole, members, names };
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

	//#region roles

	const roles: { gameRole:IGameRole; guildRole:Role|null; }[] = [];
	const gameRoles = game.roles;
	for (const gameRole of gameRoles) {
		const guildRole = await sageMessage.sageCache.discord.fetchGuildRole(gameRole.did);
		roles.push({ gameRole, guildRole });
	}
	const validRoles = roles.filter(role => role.guildRole).map(role => `@${role.guildRole!.name} (${GameRoleType[role.gameRole.type]})`);
	renderableContent.append(`<b>Roles</b> ${validRoles.length}; ${validRoles.join(", ")}`);
	const orphanedRoles = roles.filter(role => !role.guildRole).map(role => `@${role.gameRole.did} (${GameRoleType[role.gameRole.type]})`);
	if (orphanedRoles.length) {
		renderableContent.append(`<b>Orphaned Roles</b> ${orphanedRoles.length}; ${orphanedRoles.join(", ")}`);
	}

	//#endregion

	//#region game masters

	const gameMasterDids = game.users.filter(user => user.type === GameUserType.GameMaster).map(user => user.did);
	const gameMastersAndOrphans = await fetchMembersAndOrphans(sageMessage.sageCache.discord, gameMasterDids, game.gmRole?.did);
	renderableContent.append(`<b>Game Master Name</b>`, `[spacer]${game.gmCharacterName ?? `<i>inherited (${game.server.defaultGmCharacterName ?? GameCharacter.defaultGmCharacterName})</i>`}`);
	renderableContent.append(`<b>Game Masters</b> ${gameMastersAndOrphans.names.length}`);
	gameMastersAndOrphans.names.forEach(gm => renderableContent.append(`[spacer]${gm}`));
	if (gameMastersAndOrphans.byRole.length && gameMastersAndOrphans.byUser.length) {
		renderableContent.append(`<i>${toSuperscript(0)}</i> Game Master added directly to the Game.`);
		renderableContent.append(`<i>${toSuperscript(1)}</i> Game Master added via Role.`);
	}
	if (gameMastersAndOrphans.orphans.length) {
		renderableContent.append(`<b>Orphaned Game Masters</b> ${gameMastersAndOrphans.orphans.length}; ${gameMastersAndOrphans.orphans.join(", ")}`);
	}

	//#endregion

	//#region npcs

	const nonPlayerCharacters = await game.fetchNonPlayerCharacters();
	renderableContent.append(`<b>NonPlayer Characters</b> ${nonPlayerCharacters.length}`);

	//#endregion

	//#region players

	const playerCharacters = await game.fetchPlayerCharacters();
	const playerDids = game.users.filter(user => user.type === GameUserType.Player).map(user => user.did);
	const playersAndOrphans = await fetchMembersAndOrphans(sageMessage.sageCache.discord, playerDids, game.playerRole?.did);
	renderableContent.append(`<b>Players (Characters)</b> ${playersAndOrphans.names.length}`);
	playersAndOrphans.members.forEach((member, index) => {
		const playerName = playersAndOrphans.names[index];
		const pc = playerCharacters.findByUser(member.id);
		const pcName = pc?.name ? ` (${pc.name})` : ``;
		renderableContent.append(`[spacer]${playerName}${pcName}`);
	});
	if (playersAndOrphans.byRole.length && playersAndOrphans.byUser.length) {
		renderableContent.append(`<i>${toSuperscript(0)}</i> Player added directly to the Game.`);
		renderableContent.append(`<i>${toSuperscript(1)}</i> Player added via Role.`);
	}

	if (playersAndOrphans.orphans.length) {
		renderableContent.append(`<b>Orphaned Players</b> ${playersAndOrphans.orphans.length}; ${playersAndOrphans.orphans.join(", ")}`);
	}

	//#endregion

	const orphanPCs = playerCharacters.filter(pc => gameMastersAndOrphans.orphans.includes(pc.userDid!) || playersAndOrphans.orphans.includes(pc.userDid!));
	if (orphanPCs.length) {
		renderableContent.append(`<b>Orphaned Player Characters</b> ${orphanPCs.length}`);
		orphanPCs.forEach(pc => renderableContent.append(`[spacer]${pc.name}`));
	}

	await showGameRenderDialogType(renderableContent, sageMessage, game);
	gameDetailsAppendDice(renderableContent, game);
	await showGameRenderServer(renderableContent, sageMessage, game);
	await sageMessage.send(renderableContent);

	if (sageMessage.server && !skipPrune) {
		const missingSnowflakes = playersAndOrphans.orphans.concat(gameMastersAndOrphans.orphans);

		if (missingSnowflakes.length) {
			const message = `${missingSnowflakes.length} user(s) left the server.\nRemove them from the game?`;
			const remove = await discordPromptYesNo(sageMessage, message);
			if (remove) {
				const removed = await game.removeUsers(missingSnowflakes);
				if (removed) {
					await gameDetails(sageMessage, true);
				} else {
					sageMessage.whisper(`Unknown Error;\n<i>Unable to remove user(s)!</i>`);
				}
			}
		}

	}
}

type TGameOptions = TDefaultGameOptions & {
	gameType: GameType;
	gmCharacterName: string;
	name: string;
};

function getServerValues(server: Server): Partial<TGameOptions> {
	const { defaultGameType, defaultCritMethodType, defaultDialogType, defaultDiceOutputType, defaultDicePostType, defaultDiceSecretMethodType } = server;
	return { gameType: defaultGameType, defaultCritMethodType, defaultDialogType, defaultDiceOutputType, defaultDicePostType, defaultDiceSecretMethodType };
}

function getArgValues(sageMessage: SageMessage): Args<TGameOptions> {
	return {
		...getServerDefaultGameOptions(sageMessage.args),
		gameType: getEnum(sageMessage.args, GameType, "gameType", "type")
	}
}

function getGameValues(sageMessage: SageMessage<true>): Partial<TGameOptions> {
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
function getGameChannels(sageMessage: SageMessage): IChannel[] {
	const channels: IChannel[] = [];

	const ic = sageMessage.args.removeByKey("ic")?.value;
	if (ic && DiscordId.isChannelReference(ic)) {
		channels.push({ did:DiscordId.parseId(ic), gameChannelType:GameChannelType.InCharacter });
	}

	const ooc = sageMessage.args.removeByKey("ooc")?.value;
	if (ooc && DiscordId.isChannelReference(ooc)) {
		channels.push({ did:DiscordId.parseId(ooc), gameChannelType:GameChannelType.OutOfCharacter });
	}

	if (!channels.length) {
		channels.push({ did:sageMessage.discordKey.channel, gameChannelType:GameChannelType.Miscellaneous });
	}

	return channels;
}
async function getGameUsers(sageMessage: SageMessage): Promise<IGameUser[]> {
	const users: IGameUser[] = [];

	const gm = sageMessage.args.removeByKey("gm")?.value;
	if (gm && DiscordId.isUserMention(gm)) {
		users.push({ did:DiscordId.parseId(gm), type:GameUserType.GameMaster, dicePing:true });
	}

	const role = sageMessage.args.removeByKey(/(players|table|role)/i)?.value;
	if (role && DiscordId.isRoleMention(role)) {
		const roleDid = DiscordId.parseId(role);
		const discord = await sageMessage.sageCache.discord.forGuild(sageMessage.sageCache.guild?.d);
		const guildRole = await discord?.fetchGuildRole(roleDid);
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
function createGame(sageMessage: SageMessage<true>, name: string, gameValues: Partial<TGameOptions>, channels: IChannel[], users: IGameUser[]): Game {
	return new Game({
		...gameValues,
		objectType: "Game",
		id: generate(),
		serverDid: sageMessage.server.did,
		serverId: sageMessage.server.id,
		createdTs: Date.now(),
		name,
		channels,
		colors: sageMessage.server.colors.toArray(),
		users
	}, sageMessage.server, sageMessage.sageCache);
}

async function gameCreate(sageMessage: SageMessage<true>): Promise<void> {
	const denial = sageMessage.checkDenyAdminGames("Create Game");
	if (denial) {
		return denial;
	}
	if (!sageMessage.discordKey.hasChannel) {
		return sageMessage.deny("Create Game", "Unable to create Game.", "You must provide at least one channel to create a Game.");
	}
	if (sageMessage.game) {
		return sageMessage.deny("Create Game", "Unable to create Game.", "A Game already exists for this channel.");
	}

	const name = sageMessage.args.getString("name")?.trim();
	const gameValues = getGameValues(sageMessage);
	const gameChannels = getGameChannels(sageMessage);
	const gameUsers = await getGameUsers(sageMessage);

	const hasName = !!name;
	const hasValues = !!Object.keys(gameValues).find(key => (gameValues as any)[key] !== undefined);
	const hasChannel = !!gameChannels.length;
	if (!hasName || !hasValues || !hasChannel) {
		return sageMessage.reactFailure("New games must have a name, at least one channel, and at least one setting.\nPlease try:\n`sage!!game create name=\"GAME NAME\" type=\"PF2E\" ic=\"#IN_CHARACTER_CHANNEL\" ooc=\"OUT_OF_CHARACTER_CHANNEL\" gm=\"@GM_MENTION\" players=\"@PLAYER_ROLE_MENTION\"`");
	}

	const game = createGame(sageMessage, name, gameValues, gameChannels, gameUsers);
	await gameDetails(sageMessage, true, game);
	const create = await discordPromptYesNo(sageMessage, `Create Game?`);

	if (create) {
		const gameSaved = game ? await game.save() : false;
		const serverSaved = gameSaved ? await sageMessage.server.save() : false;

		const added = gameSaved && serverSaved;
		return sageMessage.reactSuccessOrFailure(added, "Game Created.", "Unknown Error; Game NOT Created!");
	}
}

function getGameOptions(args: ISageCommandArgs): Args<TGameOptions> | null {
	const opts: Args<TGameOptions> = {
		...getDefaultGameOptions(args),
		gameType: getEnum(args, GameType, "gameType", "type"),
		gmCharacterName: args.getString("gmCharName"),
		name: args.getString("newName")
	};
	return hasValues(opts) ? opts : null;
}

async function gameUpdate(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Update Game");
	if (denial) {
		return denial;
	}

	const options = getGameOptions(sageMessage.args);
	if (options === null) {
		return sageMessage.reactFailure("No Game Options given.");
	}

	const updated = await sageMessage.game!.update(options);
	if (updated) {
		return gameDetails(sageMessage, true, sageMessage.game);
	}
	return sageMessage.reactSuccessOrFailure(updated, "Game Updated", "Unknown Error; Game NOT Updated!");
}

async function gameArchive(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Update Game");
	if (denial) {
		return denial;
	}

	// TODO: consider allowing removing games by messaging bot directly

	await gameDetails(sageMessage);
	const archive = await discordPromptYesNo(sageMessage, `Archive Game?`);
	if (archive) {
		const archived = await sageMessage.game!.archive();
		return sageMessage.reactSuccessOrFailure(archived, "Game Archived", "Unknown Error; Game NOT Archived!");
	}
	return Promise.resolve();
}

async function gameToggleDicePing(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyCommand("My Game List");
	if (denial) {
		return denial;
	}

	const message = sageMessage.isGameMaster
		? "Do you want to get a ping when dice are rolled in this game?"
		: "Do you want to get a ping when you roll dice in this game?";
	const yesNo = await discordPromptYesNo(sageMessage, message);
	if (yesNo === true || yesNo === false) {
		const updated = await sageMessage.game?.updateDicePing(sageMessage.actor.did, yesNo);
		await sageMessage.reactSuccessOrFailure(updated === true, "Dice Ping Toggled!", "Unknown Error; Game NOT Toggled!");
	}
}

export function register(): void {
	registerAdminCommand(gameCount, "game-count");
	registerAdminCommandHelp("Admin", "Game", "game count");

	registerAdminCommand(myGameList, "my-games");

	registerAdminCommand(gameList, "game-list", "games-list", "game-archive-list", "games-archive-list");
	registerAdminCommandHelp("Admin", "Game", "game archive list");
	registerAdminCommandHelp("Admin", "Game", "game list");

	registerAdminCommand(gameDetails, "game-details");
	registerAdminCommandHelp("Admin", "Game", "game details");

	registerAdminCommand(gameCreate, "game-create", "game-add", "game-new");
	// registerAdminCommandHelp("Admin", "Game", "game create {Game Name} {(Optional Acronym)}");
	// registerAdminCommandHelp("Admin", "Game", "game create {Game Name} {#OptionalChannelReferences}");
	// registerAdminCommandHelp("Admin", "Game", "game create {Game Name} {@GameMasterReference} {@OptionalPlayerReferences}");
	registerAdminCommandHelp("Admin", "Game", `game create name="Game Name"`);
	registerAdminCommandHelp("Admin", "Game", `game create name="Game Name" game="DND5E|E20|PF2E|Quest|NONE"`);

	registerAdminCommand(gameUpdate, "game-update", "game-set");
	registerAdminCommandHelp("Admin", "Game", `game update name="New Name"`);
	registerAdminCommandHelp("Admin", "Game", `game update game="DND5E|E20|PF2E|Quest|NONE"`);
	registerAdminCommandHelp("Admin", "Game", `game update diceoutput="XXS|XS|S|M|L|XL|XXL|ROLLEM|UNSET"`);

	registerAdminCommand(gameToggleDicePing, "game-toggle-dice-ping");
	registerAdminCommandHelp("Admin", "Game", `game toggle dice ping`);

	registerAdminCommand(gameArchive, "game-archive");
	registerAdminCommandHelp("Admin", "Game", "game archive");
}
