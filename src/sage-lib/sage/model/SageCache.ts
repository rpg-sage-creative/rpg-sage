import type { Client, Guild, GuildMember, Role, Snowflake } from "discord.js";
import utils, { Optional, UUID } from "../../../sage-utils";
import { warnUnknownElseErrorReturnNull } from "../../../sage-utils/utils/DiscordUtils";
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
import type Server from "./Server";
import { AdminRoleType } from "./Server";
import type User from "./User";

type SageCacheCore<
		HasGuild extends boolean = boolean,
		HasGuildChannel extends boolean = boolean,
		HasUser extends boolean = boolean,
		Fetches = DiscordFetches<HasGuild, HasGuildChannel, HasUser>
		> = {
	discord: Fetches;
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

export type TServerPair = TSageDiscordPair<Guild, Server> & {
	gameAdminRole?: Role;
};

async function pairServer(core: SageCacheCore, dGuild: Guild): Promise<TServerPair>;
async function pairServer(core: SageCacheCore, dGuild: Optional<Guild>): Promise<TServerPair | undefined>;
async function pairServer(core: SageCacheCore, dGuild: Optional<Guild>): Promise<TServerPair | undefined> {
	if (!dGuild) return undefined;
	const sServer = await core.servers.getOrCreateByGuild(dGuild);
	const paired = pair(dGuild, sServer);

	const gameAdminRoleDid = sServer.getRole(AdminRoleType.GameAdmin)?.did;
	const gameAdminRole = gameAdminRoleDid ? await dGuild.roles.fetch(gameAdminRoleDid).catch(warnUnknownElseErrorReturnNull) : null;

	return {
		gameAdminRole: gameAdminRole ?? undefined,
		...paired
	};
}

//#endregion

//#region UserPair

export type TUserPair = TSageDiscordPair<DUser, User> & TIsGameAdmin & TIsServerAdmin & {
	/** from discord */
	guildMember?: GuildMember;

	/** from discord */
	isBot: boolean;

	/** a sage dev */
	isSuperUser: boolean;
}

type TIsGameAdmin = {
	/** from sage server admin roles, only checked if not admin by user */
	isGameAdminByRole?: boolean;

	/** from sage server admins */
	isGameAdminByUser: boolean;

	/** isGameAdminByRole || isGameAdminByUser */
	isGameAdmin: boolean;
};

async function getIsGameAdmin(core: SageCacheCore, did: Snowflake): Promise<TIsGameAdmin> {
	const sServer = core.server?.s;

	const isGameAdminByUser = sServer?.hasAdmin(did, AdminRoleType.GameAdmin) === true;

	let isGameAdminByRole: boolean | undefined;
	if (!isGameAdminByUser) {
		isGameAdminByRole = core.server?.gameAdminRole?.members.has(did) === true;
	}

	const isGameAdmin = isGameAdminByRole || isGameAdminByUser;

	return { isGameAdmin, isGameAdminByRole, isGameAdminByUser };
}

type TIsServerAdmin = {
	/** from discord */
	isServerOwner: boolean;

	/** from discord */
	isServerAdministrator?: boolean;

	/** from discord */
	isServerManager?: boolean;

	/** isServerOwner || isServerAdministrator || isServerManager */
	isServerAdmin: boolean;
};

async function getIsServerAdmin(core: SageCacheCore, did: Snowflake, guildMember: Optional<GuildMember>): Promise<TIsServerAdmin> {
	const guild = core.server?.d;

	let isServerAdministrator: boolean | undefined;
	let isServerManager: boolean | undefined;

	const isServerOwner = did === guild?.ownerId;
	if (!isServerOwner) {
		isServerAdministrator = guildMember?.permissions?.has("ADMINISTRATOR") === true;
		isServerManager = guildMember?.permissions?.has("MANAGE_GUILD") === true;
	}

	const isServerAdmin = isServerAdministrator || isServerManager || isServerOwner;

	return { isServerAdmin, isServerAdministrator, isServerManager, isServerOwner };
}

async function pairUser(core: SageCacheCore, dUser: DUser): Promise<TUserPair>;
async function pairUser(core: SageCacheCore, dUser: GuildMember): Promise<TUserPair>;
async function pairUser(core: SageCacheCore, dUser: Optional<DUser>): Promise<TUserPair | undefined>
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

	const guildMember = isGuildMember ? user : await core.server?.d.members.fetch(dUser.id).catch(warnUnknownElseErrorReturnNull);

	const gameAdmin = await getIsGameAdmin(core, dUser.id);
	const serverAdmin = await getIsServerAdmin(core, dUser.id, guildMember);

	return {
		isBot: dUser.bot,
		isSuperUser: sUser.isSuperUser,
		guildMember: guildMember ?? undefined,
		...paired,
		...gameAdmin,
		...serverAdmin
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

export default class SageCache<
		HasGuild extends boolean = boolean,
		HasGuildChannel extends boolean = boolean,
		HasUser extends boolean = boolean
		> {
	constructor(protected core: SageCacheCore) { }

	public get sendEmbedsAsContent(): boolean { return this.actor.s.defaultSagePostType === DialogType.Post; }

	public get discord(): DiscordFetches<HasGuild, HasGuildChannel, HasUser> { return this.core.discord; }
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

	/** The User objects for the author of the message. */
	// public get author(): TSageDiscordPair<DUser, User> | undefined	{ return this.core.author; }

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

	// protected static create(core: TSageCacheCore): SageCache {
	// 	return new SageCache(core);
	// }

	public static async fromClient(client: Client): Promise<SageCache<false, false, false>> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordFetches.from({ client });
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		return sageCache;
	}

	public static async fromMessage(message: DMessage<true>, discordActor?: Optional<DUser>): Promise<SageCache<true, true, false>>;
	public static async fromMessage(message: DMessage<false>, discordActor?: Optional<DUser>): Promise<SageCache<false, false, true>>;
	public static async fromMessage(message: DMessage, discordActor?: Optional<DUser>): Promise<SageCache>;
	public static async fromMessage(message: DMessage, discordActor?: Optional<DUser>): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordFetches.fromMessage(message);
		core.discordKey = DiscordKey.fromMessage(message);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		core.server = await pairServer(core, message.guild);
		core.actor = await pairUser(core, discordActor ?? message.author!);
		// core.author = await pairUser(core, message.author);
		if (message.guild) {
			core.channel = message.channel as DChannel;
			core.game = await core.games.findActiveByDiscordKey(core.discordKey);
		}
		return sageCache;
	}

	public static async fromMessageReaction(messageReaction: DReaction, discordActor: DUser): Promise<SageCache> {
		return SageCache.fromMessage(messageReaction.message as DMessage<true>, discordActor);
	}

	public static async fromInteraction(interaction: DInteraction): Promise<SageCache<false, false, true>> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordFetches.fromInteraction(interaction);
		core.discordKey = DiscordKey.fromInteraction(interaction);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		core.server = await pairServer(core, interaction.guild);
		core.actor = await pairUser(core, interaction.user);
		// core.author = !interaction.isApplicationCommand() ? await pairUser(core, interaction.message.author as DUser) : undefined;
		if (interaction.guild) {
			core.channel = interaction.channel as DChannel;
			core.game = await core.games.findActiveByDiscordKey(core.discordKey);
		}
		return sageCache;
	}

}
