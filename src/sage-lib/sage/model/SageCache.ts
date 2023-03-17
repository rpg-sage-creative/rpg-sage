import { Client, Guild, GuildMember, PermissionFlagsBits, Role, Snowflake } from "discord.js";
import utils, { Optional, UUID } from "../../../sage-utils";
import { handleDiscordErrorReturnNull } from "../../../sage-utils/utils/DiscordUtils";
import DiscordFetches from "../../../sage-utils/utils/DiscordUtils/DiscordFetches";
import DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import type { DChannel, DInteraction, DMessage, DReaction, DUser } from "../../../sage-utils/utils/DiscordUtils/types";
import ActiveBot from "../model/ActiveBot";
import { DialogType } from "../repo/base/channel";
import BotRepo from "../repo/BotRepo";
import GameRepo from "../repo/GameRepo";
import ServerRepo from "../repo/ServerRepo";
import UserRepo from "../repo/UserRepo";
import type Bot from "./Bot";
import type Game from "./Game";
import { GameRoleType, GameUserType } from "./Game";
import type Server from "./Server";
import { AdminRoleType } from "./Server";
import type User from "./User";

type SageCacheCore = {
	discord: DiscordFetches;
	discordKey: DiscordKey;

	bots: BotRepo;
	servers: ServerRepo;
	games: GameRepo;
	users: UserRepo;

	/** The User objects for the actor doing the thing. */
	actor: TUserPair;

	/** The User objects for the author of the message. */
	// author?: TSageDiscordPair<DUser, User>;

	bot: Bot;

	channel?: DChannel;

	game?: Game;

	/** RPG Sage's home Discord server */
	home: Server;

	/** Sage ServerGuild objects being acted in/upon. */
	server?: TServerPair;

};

/** This object's id is a Discord Snowflake. */
type THasShowflakeId = { id:Snowflake; };

/** This object's id is a UUID. */
type THasUuidId = { id:UUID; };

//#region SageDiscordPair

/** This object represents a pairing of a Sage object and its corresponding Discord object. */
export type TSageDiscordPair<T extends THasShowflakeId, U extends THasUuidId> = {
	/** Discord object */
	d: T;
	/** Snowflake representing the Discord object */
	did: Snowflake;
	/** UUID representing the Sage object */
	uuid: UUID;
	/** Sage object */
	s: U;
};

/** Helper for creating TSageDiscordPair objects. */
function pair<D extends THasShowflakeId, S extends THasUuidId>(d: D, s: S): TSageDiscordPair<D, S> {
	return { d, did:d.id, uuid:s.id, s };
}

//#region ServerPair

type TServerRoles = {
	// AdminRoleType { Unknown = 0, GameAdmin = 1 }
	gameAdmin?: Role;
};

type TGameRoles = {
	// GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Table = 4, Room = 5 }
	spectator?: Role;
	player?: Role;
	gameMaster?: Role;
	table?: Role;
	room?: Role;
};

export type TServerPair = TSageDiscordPair<Guild, Server> & {
	serverRoles: TServerRoles;
	gameRoles: TGameRoles;
};

async function getServerRoles(paired: TSageDiscordPair<Guild, Server>): Promise<TServerRoles> {
	const gameAdminRoleDid = paired.s.getRole(AdminRoleType.GameAdmin)?.did;
	const gameAdminRole = gameAdminRoleDid ? await paired.d.roles.fetch(gameAdminRoleDid).catch(handleDiscordErrorReturnNull) : null;

	return {
		gameAdmin: gameAdminRole ?? undefined
	};
}

async function getGameRoles(game: Game, guild: Guild): Promise<TGameRoles> {
	const spectatorRoleDid = game.getRole(GameRoleType.Spectator)?.did;
	const spectatorRole = spectatorRoleDid ? await guild.roles.fetch(spectatorRoleDid).catch(handleDiscordErrorReturnNull) : null;

	const playerRoleDid = game.getRole(GameRoleType.Player)?.did;
	const playerRole = playerRoleDid ? await guild.roles.fetch(playerRoleDid).catch(handleDiscordErrorReturnNull) : null;

	const gameMasterRoleDid = game.getRole(GameRoleType.GameMaster)?.did;
	const gameMasterRole = gameMasterRoleDid ? await guild.roles.fetch(gameMasterRoleDid).catch(handleDiscordErrorReturnNull) : null;

	const tableRoleDid = game.getRole(GameRoleType.Table)?.did;
	const tableRole = tableRoleDid ? await guild.roles.fetch(tableRoleDid).catch(handleDiscordErrorReturnNull) : null;

	const roomRoleDid = game.getRole(GameRoleType.Room)?.did;
	const roomRole = roomRoleDid ? await guild.roles.fetch(roomRoleDid).catch(handleDiscordErrorReturnNull) : null;

	return {
		spectator: spectatorRole ?? undefined,
		player: playerRole ?? undefined,
		gameMaster: gameMasterRole ?? undefined,
		table: tableRole ?? undefined,
		room: roomRole ?? undefined
	};
}

/** MUST run AFTER setting the core.Game */
async function pairServer(core: SageCacheCore, dGuild: Optional<Guild>): Promise<TServerPair | undefined> {
	if (!dGuild) return undefined;
	const sServer = await core.servers.getOrCreateByGuild(dGuild);
	const paired = pair(dGuild, sServer);

	const serverRoles = await getServerRoles(paired);

	const gameRoles = core.game ? await getGameRoles(core.game, dGuild) : { };

	return {
		serverRoles,
		gameRoles,
		...paired
	};
}

//#endregion

//#region UserPair

export type TUserPair = TSageDiscordPair<DUser, User> & {
	/** from discord */
	guildMember?: GuildMember;

	/** from discord */
	isBot: boolean;

	/** a sage dev */
	isSuperUser: boolean;

	/** able to admin games */
	isGameAdmin?: TIsGameAdmin;

	/** able to access the game */
	isGameUser?: TIsGameUser;

	/** able to admin Sage */
	isServerAdmin?: TIsServerAdmin;
}

type TByRoleOrByUser = {
	/** Has access via a Role, only checked if !byUser. */
	byRole?: boolean;
	/** Has access by having been added manually. */
	byUser: boolean;
};

type TByRoleOrByUserOrByOther = TByRoleOrByUser & {
	/** Has access from some other method. */
	byOther: boolean;
};

function pairByRoleOrByUser(byRole: boolean | undefined, byUser: boolean): TByRoleOrByUser | undefined;
function pairByRoleOrByUser(byRole: boolean | undefined, byUser: boolean, byOther: boolean | undefined): TByRoleOrByUserOrByOther | undefined;
function pairByRoleOrByUser(byRole: boolean | undefined, byUser: boolean, byOther?: boolean | undefined): TByRoleOrByUser | TByRoleOrByUserOrByOther | undefined {
	if (byOther) {
		return { byRole, byUser, byOther };
	}
	return byRole || byUser ? { byRole, byUser } : undefined;
}

type TIsGameAdmin = TByRoleOrByUser | false;

async function getIsGameAdmin(core: SageCacheCore, did: Snowflake): Promise<TIsGameAdmin | undefined> {
	const sServer = core.server?.s;

	const byUser = sServer?.hasAdmin(did, AdminRoleType.GameAdmin) === true;
	const byRole = byUser ? undefined : core.server?.serverRoles.gameAdmin?.members.has(did) === true;
	return pairByRoleOrByUser(byRole, byUser);
}

type TIsGameUser = {
	// GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Table = 4, Room = 5 }

	/** Can see the game, but cannot interact with the game. */
	isSpectator?: TByRoleOrByUser;

	/** Is a player of the game. */
	isPlayer?: TByRoleOrByUser;

	/** Is a game master of the game. */
	isGameMaster?: TByRoleOrByUser;

	/** isPlayer || isGameMaster */
	isTable?: TByRoleOrByUserOrByOther;

	/** isSpectator || isPlayer || isGameMaster */
	isRoom?: TByRoleOrByUserOrByOther;
}

async function getIsGameUser(core: SageCacheCore, did: Snowflake): Promise<TIsGameUser | undefined> {
	const game = core.game;
	if (!game) return undefined;

	const spectatorByUser = false; // game.getUser(did)?.type === GameRoleType.Spectator; // GameUserType !== GameRoleType
	const spectatorByRole = spectatorByUser ? undefined : core.server?.gameRoles.spectator?.members.has(did) === true;
	const isSpectator = pairByRoleOrByUser(spectatorByRole, spectatorByUser);

	const playerByUser = game.getUser(did)?.type === GameUserType.Player;
	const playerByRole = playerByUser ? undefined : core.server?.gameRoles.player?.members.has(did) === true;
	const isPlayer = pairByRoleOrByUser(playerByRole, playerByUser);

	const gameMasterByUser = game.getUser(did)?.type === GameUserType.GameMaster;
	const gameMasterByRole = gameMasterByUser ? undefined : core.server?.gameRoles.gameMaster?.members.has(did) === true;
	const isGameMaster = pairByRoleOrByUser(gameMasterByRole, gameMasterByUser);

	const tableByUser = false; // game.getUser(did)?.type === GameRoleType.Spectator; // GameUserType !== GameRoleType
	const tableByRole = tableByUser ? undefined : core.server?.gameRoles.spectator?.members.has(did) === true;
	const isTable = pairByRoleOrByUser(tableByRole, tableByUser, !!isPlayer || !!isGameMaster);

	const roomByUser = false; // game.getUser(did)?.type === GameRoleType.Spectator; // GameUserType !== GameRoleType
	const roomByRole = roomByUser ? undefined : core.server?.gameRoles.spectator?.members.has(did) === true;
	const isRoom = pairByRoleOrByUser(roomByRole, roomByUser, !!isTable || !!isSpectator);

	const isGameUser = isSpectator || isPlayer || isGameMaster || isTable || isRoom;
	return isGameUser ? { isSpectator, isPlayer, isGameMaster, isTable, isRoom } : undefined;
}

type TIsServerAdmin = {
	/** from discord */
	asOwner: boolean;

	/** from discord, only checked if !asOwner */
	asAdministrator?: boolean;

	/** from discord, only checked if !asOwner */
	asManager?: boolean;
};

async function getIsServerAdmin(core: SageCacheCore, did: Snowflake, guildMember: Optional<GuildMember>): Promise<TIsServerAdmin | undefined> {
	const guild = core.server?.d;

	let asAdministrator: boolean | undefined;
	let asManager: boolean | undefined;

	const asOwner = did === guild?.ownerId;
	if (!asOwner) {
		asAdministrator = guildMember?.permissions?.has(PermissionFlagsBits.Administrator) === true;
		asManager = guildMember?.permissions?.has(PermissionFlagsBits.ManageGuild) === true;
	}

	const isServerAdmin = asAdministrator || asManager || asOwner;
	return isServerAdmin ? { asAdministrator, asManager, asOwner } : undefined;
}

/** MUST run AFTER pairServer */
async function pairUser(core: SageCacheCore, dUser: DUser): Promise<TUserPair>;
/** MUST run AFTER pairServer */
async function pairUser(core: SageCacheCore, dUser: GuildMember): Promise<TUserPair>;
/** MUST run AFTER pairServer */
async function pairUser(core: SageCacheCore, dUser: Optional<DUser>): Promise<TUserPair | undefined>
/** MUST run AFTER pairServer */
async function pairUser(core: SageCacheCore, user: Optional<DUser | GuildMember>): Promise<TUserPair | undefined> {
	// Don't bother w/o user
	if (!user) return undefined;

	// Get base User
	const isGuildMember = "user" in user;
	const dUser = isGuildMember ? user.user : user;

	// If this is an author and we already have the same user as the actor, just use it
	if (core.actor?.did === dUser.id) return core.actor;

	const sUser = await core.users.getOrCreateByDid(dUser.id);
	const paired = pair(dUser, sUser);

	const guildMember = isGuildMember ? user : await core.server?.d.members.fetch(dUser.id).catch(handleDiscordErrorReturnNull);

	const isGameAdmin = await getIsGameAdmin(core, dUser.id);
	const isServerAdmin = await getIsServerAdmin(core, dUser.id, guildMember);
	const isGameUser = await getIsGameUser(core, dUser.id);

	return {
		isBot: dUser.bot,
		isGameAdmin,
		isGameUser,
		isServerAdmin,
		isSuperUser: sUser.isSuperUser,
		guildMember: guildMember ?? undefined,
		...paired
	};
}

//#endregion

//#endregion

/** Helper for creating SageCache that returns both it and its core for extending. */
function createCoreAndCache(): { core:SageCacheCore, sageCache:SageCache } {
	const core = { } as SageCacheCore,
		sageCache = new SageCache(core);
	core.bots = new BotRepo(sageCache);
	core.servers = new ServerRepo(sageCache);
	core.games = new GameRepo(sageCache);
	core.users = new UserRepo(sageCache);
	return { core, sageCache };
}

export default class SageCache {
	constructor(protected core: SageCacheCore) { }

	public get sendEmbedsAsContent(): boolean { return this.actor.s.defaultSagePostType === DialogType.Post; }

	public get discord(): DiscordFetches { return this.core.discord; }
	public get discordKey(): DiscordKey { return this.core.discordKey; }

	public get bots(): BotRepo { return this.core.bots; }
	public get servers(): ServerRepo { return this.core.servers; }
	public get games(): GameRepo { return this.core.games; }
	public get users(): UserRepo { return this.core.users; }

	public get bot(): Bot { return this.core.bot; }
	public get home(): Server { return this.core.home; }

	public get guild(): TServerPair | undefined { return this.core.server; }

	public get channel(): DChannel | undefined { return this.core.channel; }

	public get game(): Game | undefined { return this.core.game; }

	/** The User objects for the actor doing the thing. */
	public get actor(): TUserPair { return this.core.actor; }

	public emojify(text: string): string {
		if (this.game) {
			return this.game.emojify(text);
		}
		if (this.guild) {
			return this.guild.s.emojify(text);
		}
		return this.bot.emojify(text);
	}

	public format(text: string): string {
		return utils.StringUtils.Markdown.format(this.emojify(text));
	}

	public getFormatter(): (content: string) => string;
	public getFormatter(channel: DChannel): (content: string) => string;
	public getFormatter(): (content: string) => string {
		let sageCache: SageCache = this;
		/**
		 * @todo determine if we even need this logic.
		 * it may have been designed for future proofing of channel setting overrides.
		 * but currently our format function ignores channel settings.
		 */
		// if (channel && channel.id !== this.channel?.id) {
		// 	const core = { ...this.core };
		// 	core.discordKey = DiscordKey.fromChannel(channel);
		// 	sageCache = new SageCache(core);
		// }
		return sageCache.format.bind(sageCache);
	}

	public getPrefixOrDefault(): string {
		return this.guild?.s.getPrefixOrDefault() ?? "";
	}

	public static async fromClient(client: Client): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordFetches.from({ client });
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		return sageCache;
	}

	public static async fromMessage(message: DMessage, discordActor?: Optional<DUser>): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordFetches.fromMessage(message);
		core.discordKey = DiscordKey.fromMessage(message);
		core.bot = ActiveBot.active;
		core.channel = message.guild ? message.channel as DChannel : undefined;
		core.game = message.guild ? await core.games.findActiveByDiscordKey(core.discordKey) : undefined;
		core.home = await core.servers.getHome();
		core.server = await pairServer(core, message.guild); // MUST run AFTER setting core.game
		core.actor = await pairUser(core, discordActor ?? message.author!); // MUST run AFTER setting core.server
		// core.author = await pairUser(core, message.author);
		return sageCache;
	}

	public static async fromMessageReaction(messageReaction: DReaction, discordActor: DUser): Promise<SageCache> {
		return SageCache.fromMessage(messageReaction.message as DMessage<true>, discordActor);
	}

	public static async fromInteraction(interaction: DInteraction): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordFetches.fromInteraction(interaction);
		core.discordKey = DiscordKey.fromInteraction(interaction);
		core.bot = ActiveBot.active;
		core.channel = interaction.channel as DChannel ?? undefined;
		core.game = interaction.guild ? await core.games.findActiveByDiscordKey(core.discordKey) : undefined;
		core.home = await core.servers.getHome();
		core.server = await pairServer(core, interaction.guild); // MUST run AFTER setting core.game
		core.actor = await pairUser(core, interaction.user); // MUST run AFTER setting core.server
		// core.author = !interaction.isApplicationCommand() ? await pairUser(core, interaction.message.author as DUser) : undefined;
		return sageCache;
	}

}
