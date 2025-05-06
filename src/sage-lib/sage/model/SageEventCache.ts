import { getHomeServerId, getTupperBoxId, isSageId } from "@rsc-sage/env";
import { debug, errorReturnFalse, errorReturnUndefined, isDefined, mapAsync, orNilSnowflake, parseUuid, silly, uncache, warn, type Optional, type RenderableContentResolvable, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { canSendMessageTo, DiscordCache, DiscordKey, fetchIfPartial, getPermsFor, isDiscordApiError, isThread, toHumanReadable, type DInteraction, type MessageChannel, type MessageOrPartial, type MessageReferenceOrPartial, type MessageTarget, type ReactionOrPartial, type SMessage, type UserOrPartial } from "@rsc-utils/discord-utils";
import { toMarkdown } from "@rsc-utils/string-utils";
import type { Channel, User as DUser, Guild, GuildMember, Interaction, Message } from "discord.js";
import { getLocalizedText, type Localizer } from "../../../sage-lang/getLocalizedText.js";
import { isDeleted } from "../../discord/deletedMessages.js";
import { send } from "../../discord/messages.js";
import { ActiveBot } from "./ActiveBot.js";
import { globalCacheFilter, globalCacheRead, type GameCacheItem, type GlobalCacheItem } from "../repo/base/globalCache.js";
import { JsonRepo } from "../repo/base/JsonRepo.js";
import type { Bot } from "./Bot.js";
import { Game, GameRoleType, type GameCore } from "./Game.js";
import { Server } from "./Server.js";
import { User } from "./User.js";

let _userForSage: User | undefined;

async function getOrCreateUser(evCache: SageEventCache, id: Optional<string>): Promise<User> {
	const userId = orNilSnowflake(id);

	let user: User | undefined;
	if (isSageId(userId)) {
		_userForSage ??= new User(User.createCore(userId), evCache);
		user = _userForSage;

	}else {
		// check cache first
		user = await evCache.getOrFetchUser(userId);

		// create a new one
		user ??= new User(User.createCore(userId), evCache);
	}

	return user;
}

/**
 * @todo have ensureActor(), ensureGame(), ensureGuild()
 * Move isGameX to EnsuredGame
 * Move canManageServer, member to EnsuredGuild
 */

//#region SageEventCacheUser

type KnownUser = {
	canManageServer: boolean;
	discord: DUser;
	id: Snowflake;
	isGameMaster: boolean;
	isGamePlayer: boolean;
	isOwner: boolean;
	known: true;
	member?: GuildMember;
	sage: User;
	uuid?: UUID;
};

type UnknownUser = {
	canManageServer: false;
	discord?: DUser;
	id?: Snowflake;
	isGameMaster: false;
	isGamePlayer: false;
	isOwner: false;
	known: false;
	member?: GuildMember;
	sage: User;
	uuid?: never;
};

type UnvalidatedUser = {
	canManageServer?: never;
	discord?: never;
	id?: never;
	isGameMaster?: never;
	isGamePlayer?: never;
	isOwner?: boolean;
	known?: never;
	member?: never;
	sage: User;
	uuid?: never;
};

type SageEventCacheUser = UnvalidatedUser | UnknownUser | KnownUser;

//#endregion

//#region ValidateUser

type ValidateActorArgs = {
	which: "actor";
	actorOrPartial?: UserOrPartial;
	authorOrPartial?: never;
	messageOrPartial?: MessageOrPartial;
	reactionOrPartial?: ReactionOrPartial;
};

type ValidateAuthorArgs = {
	which: "author";
	actorOrPartial?: never;
	authorOrPartial?: UserOrPartial;
	messageOrPartial?: MessageOrPartial;
	reactionOrPartial?: ReactionOrPartial;
};

type ValidateUserArgs = ValidateActorArgs | ValidateAuthorArgs;

async function validateUser(evCache: SageEventCache, { which, actorOrPartial, authorOrPartial, messageOrPartial, reactionOrPartial }: ValidateUserArgs): Promise<SageEventCacheUser> {

	// try fetching the discord user object
	let discord = await fetchIfPartial(actorOrPartial ?? authorOrPartial);

	// actor will always get passed in, author might not if the original was a partial
	if (!discord && which === "author") {
		// if we don't have a reaction and have a message, try getting author directly from message
		if (!reactionOrPartial && messageOrPartial) {
			const message = await fetchIfPartial(messageOrPartial);
			discord = message?.author;
		}

		// still no discord user and we have a reaction, try getting it from reaction's message
		if (!discord && reactionOrPartial) {
			const reaction = await fetchIfPartial(reactionOrPartial);
			const message = await fetchIfPartial(reaction?.message);
			discord = message?.author;
		}

		// in case we managed to still have a partial ...
		discord = await fetchIfPartial(discord);
	}

	// we want to always have a sage user object, so pass in nil if we don't have an id
	const sage = await getOrCreateUser(evCache, discord?.id);

	// set flags as false by default
	let canManageServer = false;
	let isGameMaster = false;
	let isGamePlayer = false;
	let isOwner = false;

	// we don't have a valid discord user (or we couldn't fetch it for some reason)
	if (!discord?.id) {
		const unknownUser: UnknownUser = {
			canManageServer,
			id: undefined,
			isGameMaster,
			isGamePlayer,
			isOwner,
			known: false,
			sage,
		};
		return unknownUser;
	}

	// type cast id now
	const id = discord.id as Snowflake

	// we need a guildmember to check server perms
	let member: GuildMember | undefined;
	const guild = evCache.server?.discord;
	if (guild) {
		// fetch the guild member if it isn't a bot and isn't a system user
		if (!discord.bot && !discord.system) {
			member = await guild.members.fetch(id).catch(err => {
				return isDiscordApiError(err, 10007, 10013)
					? errorReturnUndefined(`guild.id = ${guild.id} (${guild.name}); guildMember.id = ${id} (${toHumanReadable(discord)})`)
					: errorReturnUndefined(err)
			});
		}

		// check the guild member for perms
		isOwner = guild.ownerId === id;
		canManageServer = isOwner || member?.permissions.has("Administrator") === true || member?.permissions.has("ManageGuild") === true
	}

	// now let's check for game access
	const { game } = evCache;
	if (game) {
		// NOTE: hasUser checks users and roles so is preferred
		isGameMaster = await game.hasUser(id, GameRoleType.GameMaster) ?? false;
		isGamePlayer = await game.hasUser(id, GameRoleType.Player) ?? false;
	}

	// keep getting uuid until we completely phase it out
	const uuid = parseUuid(sage.toJSON().uuid ?? sage.id);

	const knownUser: KnownUser = {
		canManageServer,
		discord,
		id,
		isGameMaster,
		isGamePlayer,
		isOwner,
		known: true,
		member,
		sage,
		uuid,
	};
	return knownUser;
}

//#endregion

//#region SageEventCacheServer

type KnownServer = {
	discord: Guild;
	id: Snowflake;
	isDm: false;
	isServer: true;
	known: true;
	sage: Server;
};

type UnknownServer = {
	discord?: Guild;
	id?: Snowflake;
	isDm: false;
	isServer: true;
	known: false;
	sage?: Server;
};

type DmServer = {
	discord?: never;
	id?: never;
	isDm: true;
	isServer: false;
	known: false;
	sage?: never;
};

type UnvalidatedServer = {
	discord?: Guild;
	id?: never;
	isDm?: never;
	isServer?: never;
	known?: never;
	sage?: never;
};

type SageEventCacheServer = UnvalidatedServer | DmServer | UnknownServer | KnownServer;

//#endregion

async function validateServer(evCache: SageEventCache, discord: Optional<Guild>): Promise<SageEventCacheServer> {
	// no guild means dm
	if (!discord) {
		const dmServer: DmServer = { isDm: true, isServer:false, known:false };
		return dmServer;
	}

	// type cast id
	const id = discord.id as Snowflake;

	// what means unkonwn, failed fetch ?
	// const unkonwnServer = { };
	// return unknownServer;

	// fetch sage object
	let sage = await evCache.getOrFetchServer(discord.id);

	// we didn't find one, so create one
	if (!sage) {
		sage = new Server(Server.createCore(discord), evCache);
	}

	// if the names don't match (new server or a change) then update and save
	if (sage.name !== discord.name) {
		sage.toJSON().name = discord.name;
		/** @todo we don't need the result of this save so we could fire it and not wait */
		await sage.save();
	}

	const knownServer: KnownServer = {
		discord,
		id,
		isDm: false,
		isServer: true,
		known: true,
		sage,
	}
	return knownServer;
}

//#region createSageEventCache

type SageEventCacheCore = {
	actor: SageEventCacheUser;
	/** actor of an event */
	actorOrPartial: UserOrPartial;
	author: SageEventCacheUser;
	/** author of the message being acted upon */
	authorOrPartial?: UserOrPartial;
	discord: DiscordCache;
	discordKey: DiscordKey;
	game?: Game;
	home: Server;
	/** message of a post or interaction */
	messageOrPartial?: MessageOrPartial;
	/** reaction of a reaction */
	reactionOrPartial?: ReactionOrPartial;
	repo: JsonRepo;
	server: SageEventCacheServer;
};

type SageEventCacheCreateOptions = {
	actorOrPartial: UserOrPartial;
	authorOrPartial: UserOrPartial | undefined;
	channel: Channel | undefined;
	discord: DiscordCache;
	discordKey: DiscordKey;
	guild: Guild | undefined;
	messageOrPartial: MessageOrPartial | undefined;
	reactionOrPartial?: ReactionOrPartial;
};

async function createSageEventCache(options: SageEventCacheCreateOptions): Promise<SageEventCache> {
	const { actorOrPartial, authorOrPartial, channel, discord, discordKey, guild, messageOrPartial, reactionOrPartial } = options;

	const core: SageEventCacheCore = {
		actor: undefined!, // below
		actorOrPartial,
		author: undefined!,
		authorOrPartial,
		discord,
		discordKey,
		game: undefined,
		home: undefined!, // below
		messageOrPartial,
		reactionOrPartial,
		repo: undefined!, // below
		server: undefined!, // below
	};

	const evCache = new SageEventCache(core);

	core.repo = new JsonRepo(evCache);

	core.home = await evCache.getOrFetchServer(getHomeServerId()) as Server;

	// set unvalidated actor
	core.actor = { sage:await getOrCreateUser(evCache, actorOrPartial.id) };

	// set unvalidated author
	core.author = { sage:await getOrCreateUser(evCache, authorOrPartial?.id) };

	// set unvalidated server
	core.server = { discord:guild };

	// some things we only check if we have a guild, like server perms and game related stuff
	if (guild) {

		// should we always validate owner / canmanage type stuff?
		core.actor.isOwner = guild.ownerId === actorOrPartial.id;

		// validate the server to look for the game
		const server = await evCache.validateServer();
		if (server.known) {
			// check to see if we have a server-wide game
			if (server.sage.gameId) {
				const game = await evCache.getOrFetchGame(server.sage.gameId);
				if (game && !game.isArchived) {
					core.game = game;
				}
			}

			// fall back to the active game for the channel
			if (!core.game && channel) {
				core.game = await evCache.findActiveGame(channel);
			}

			// if we have a game, we are going to probably want to want isGameMaster and isGamePlayer
			if (core.game) {
				await evCache.validateActor();
			}

		}

	}

	return evCache;
}

//#endregion

/** This is Sage's per event caching mechanism. */
export class SageEventCache {
	constructor(protected core: SageEventCacheCore) { }

	/** Clears the cache/maps in an attempt to avoid memory leaks. */
	public clear(): void {
		debug("Clearing SageEventCache");
		this.canSendMessageToMap.clear();
		this.hasTupperMap.clear();
		this.canReactToMap.clear();
		this.canWebhookToMap.clear();
		uncache(this.core);
	}

	/** Convenience method for send(SageEventCache, MessageTarget, RenderableContentResolvable, Optional<DUser>) */
	public send(targetChannel: MessageTarget, renderableContent: RenderableContentResolvable, originalAuthor: Optional<DUser>): Promise<SMessage[]> {
		return send(this, targetChannel, renderableContent, originalAuthor);
	}

	/** User that created the message. */
	public get author(): SageEventCacheUser { return this.core.author; }

	/** User doing the action. */
	public get actor(): SageEventCacheUser { return this.core.actor; }

	/** Guild/Server the event happens in. */
	public get server(): SageEventCacheServer { return this.core.server; }

	public async validateActor(): Promise<SageEventCacheUser> {
		const { core } = this;
		if (core.actor.known === undefined) {
			const { actorOrPartial, messageOrPartial, reactionOrPartial } = core;
			core.actor = await validateUser(this, { which:"actor", actorOrPartial, messageOrPartial, reactionOrPartial });
		}
		return core.actor;
	}

	public async validateAuthor(): Promise<SageEventCacheUser> {
		const { core } = this;
		if (core.author.known === undefined) {
			const { authorOrPartial, messageOrPartial, reactionOrPartial } = core;
			core.author = await validateUser(this, { which:"author", authorOrPartial, messageOrPartial, reactionOrPartial });
		}
		return core.author;
	}

	public async validateServer(): Promise<SageEventCacheServer> {
		const { core } = this;
		if (core.server.known === undefined) {
			core.server = await validateServer(this, core.server.discord);
		}
		return core.server;
	}

	private canSendMessageToMap = new Map<string, boolean>();
	public async canSendMessageTo(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.canSendMessageToMap.has(key)) {
			if (discordKey.isDm) {
				this.canSendMessageToMap.set(key, true);
			}else {
				const { thread, channel } = await this.discord.fetchChannelAndThread(discordKey);
				if (channel) {
					this.canSendMessageToMap.set(key, canSendMessageTo(DiscordCache.getSageId(), thread ?? channel));
				}else {
					this.canSendMessageToMap.set(key, false);
				}
			}
		}
		return this.canSendMessageToMap.get(key)!;
	}

	public canSendMessageToChannel(channel: MessageChannel): Promise<boolean> {
		return this.canSendMessageTo(DiscordKey.from(channel));
	}

	private hasTupperMap = new Map<string, boolean>();
	public async hasTupper(discordKey: DiscordKey): Promise<boolean> {
		if (!discordKey.hasServer) {
			return false;
		}

		// check the server before checking/fetching channels
		if (!this.hasTupperMap.has(discordKey.server)) {
			const guild = await this.discord.fetchGuild(discordKey.server);
			const isInGuild = guild?.members.cache.has(getTupperBoxId()) === true;
			this.hasTupperMap.set(discordKey.server, isInGuild);
		}
		if (this.hasTupperMap.get(discordKey.server) === false) {
			return false;
		}

		const key = discordKey.key;
		if (!this.hasTupperMap.has(key)) {
			const { thread, channel } = await this.discord.fetchChannelAndThread(discordKey);
			const isInChannel = channel ? getPermsFor(thread ?? channel, getTupperBoxId()).isInChannel : false;
			this.hasTupperMap.set(key, isInChannel);
		}
		return this.hasTupperMap.get(key) ?? false;
	}

	public async pauseForTupper(discordKey: DiscordKey): Promise<void> {
		const hasTupper = await this.hasTupper(discordKey);
		if (hasTupper) {
			// let's pause for a second in case Tupper is involved ...
			silly(`Pausing for Tupper ...`);
			await (new Promise(res => setTimeout(res, 1000)));
			silly(`                   ... done pausing for Tupper.`);
		}
	}

	private canReactToMap = new Map<string, boolean>();
	public async canReactTo(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.canReactToMap.has(key)) {
			this.canReactToMap.set(key, await _canReactTo(this, discordKey).catch(errorReturnFalse));
		}
		return !isDeleted(discordKey.message) // check deleted messages just in case
			&& this.canReactToMap.get(key)!;

		async function _canReactTo(evCache: SageEventCache, discordKey: DiscordKey): Promise<boolean> {
			if (discordKey.isDm) {
				return true;
			}else {
				const { thread, channel } = await evCache.discord.fetchChannelAndThread(discordKey);
				if (isDeleted(discordKey.message)) return false; // check deleted messages just in case
				if (channel) {
					return getPermsFor(thread ?? channel, DiscordCache.getSageId()).canAddReactions;
				}else {
					return false;
				}
			}
		}
	}

	private canWebhookToMap = new Map<string, boolean>();
	public async canWebhookTo(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.canWebhookToMap.has(key)) {
			if (discordKey.isDm) {
				this.canWebhookToMap.set(key, false);
			}else {
				const { thread, channel } = await this.discord.fetchChannelAndThread(discordKey);
				if (channel) {
					const { canManageWebhooks, canSendMessages } = getPermsFor(thread ?? channel, DiscordCache.getSageId());
					this.canWebhookToMap.set(key, canManageWebhooks && canSendMessages);
				}else {
					this.canWebhookToMap.set(key, false);
				}
			}
		}
		return this.canWebhookToMap.get(key)!;
	}

	public get discord(): DiscordCache { return this.core.discord; }
	public get discordKey(): DiscordKey { return this.core.discordKey; }

	public get bot(): Bot { return ActiveBot.active; }
	public get home(): Server { return this.core.home; }
	public get game(): Game | undefined { return this.core.game; }
	public get user(): User { return this.core.actor.sage; }

	private clone(core: SageEventCacheCore): SageEventCache {
		return new SageEventCache(core);
	}

	public cloneForChannel(channel: Optional<MessageTarget>): SageEventCache {
		const core = { ...this.core };
		if (channel) {
			core.discordKey = DiscordKey.from(channel);
		}else {
			warn(`Invalid Channel in cloneForChannel`);
		}
		return this.clone(core);
	}

	public cloneForMessage(message: MessageOrPartial): SageEventCache {
		const core = { ...this.core };
		core.discordKey = DiscordKey.from(message);
		return this.clone(core);
	}

	public emojify(text: string): string {
		if (this.game) {
			return this.game.emojify(text);
		}
		const server = this.server?.sage ?? this.home;
		if (server) {
			return server.emojify(text);
		}
		return this.bot.emojify(text);
	}

	public format(text: string): string {
		return toMarkdown(this.emojify(text));
	}

	public getPrefixOrDefault(): string {
		return this.server?.sage?.getPrefixOrDefault() ?? "";
	}

	public getLocalizer(): Localizer {
		const lang = this.user?.preferredLang ?? "en-US";
		return (key: any, ...args: any[]) => getLocalizedText(key, lang, ...args);
	}

	public async fetchChannel<T extends Channel = Channel>(channelId: Optional<Snowflake>): Promise<T | undefined> {
		if (!channelId) return undefined;
		const guildId = this.server?.id;
		if (guildId) {
			return this.discord.fetchChannel({ guildId, channelId });
		}
		if (this.user) {
			return this.discord.fetchDmChannel({ channelId, userId:this.user?.did }) as Promise<T>;
		}
		return undefined;
	}

	public async fetchGames({ archived, serverId, userId }: { archived?:boolean; serverId:Snowflake; userId?:Snowflake; }): Promise<Game[]> {

		const server = await this.getOrFetchServer(serverId);
		if (!server) return [];

		const contentFilter = (core: GameCacheItem) => {
			// match server first
			if (core.serverDid !== serverId) return false;
			// match archived or not
			if (!archived === !core.archivedTs) return false;
			// if we have a user, make sure they are in the game
			if (userId && !core.users?.some(user => user.did === userId)) return false;
			// we passed the tests
			return true;
		};

		const cacheItems = globalCacheFilter("games", contentFilter) as GlobalCacheItem[];
		const cores = await mapAsync(cacheItems, item => globalCacheRead(item)) as GameCore[];
		return cores.filter(isDefined).map(core => new Game(core, server, this));
	}

	public async fetchMessage(keyOrReference: DiscordKey | MessageReferenceOrPartial): Promise<Message | undefined> {
		return this.discord.fetchMessage(keyOrReference, this.user?.did);
	}

	public async findActiveGame(reference: Optional<Channel | DInteraction | MessageOrPartial | MessageReferenceOrPartial>): Promise<Game | undefined> {
		if (reference) {
			if ("messageId" in reference) {
				return this.findActiveGameByReference(reference);
			}
			if ("isThread" in reference) {
				return this.findActiveGameByChannel(reference);
			}
			if (reference.channel) {
				return this.findActiveGameByChannel(reference.channel);
			}
		}
		return undefined;
	}

	/** Gets the active/current Game for the MessageReference */
	private async findActiveGameByChannel(channel: Channel): Promise<Game | undefined> {
		const guildId = "guildId" in channel ? channel.guildId ?? undefined : undefined;

		const gameByChannel = await this.findActiveGameByReference({
			guildId,
			channelId: channel.id
		});
		if (gameByChannel) return gameByChannel;

		if (isThread(channel)) {
			const gameByParent = await this.findActiveGameByReference({
				guildId,
				channelId: channel.parentId!
			});
			if (gameByParent) return gameByParent;
		}

		return undefined;
	}

	/** Gets the active/current Game for the MessageReference */
	private async findActiveGameByReference(messageRef: Omit<MessageReferenceOrPartial, "messageId">): Promise<Game | undefined> {
		const { guildId, channelId } = messageRef;
		const gameFilter = (core: GameCacheItem) => !core.archivedTs
			&& core.serverDid === guildId
			&& core.channels?.some(channel => channel.id === channelId || channel.did === channelId);
		const game = await this.core.repo.find("Game", gameFilter);
		return game as Game;
	}

	public async getOrFetchGame(id: Optional<string>, did?: Optional<Snowflake>, uuid?: Optional<UUID>): Promise<Game | undefined> {
		return await this.core.repo.getById("Game", id as Snowflake, did, uuid) as Game ?? undefined;
	}

	public async getOrFetchServer(id: Optional<string>, did?: Optional<Snowflake>, uuid?: Optional<UUID>): Promise<Server | undefined> {
		return await this.core.repo.getById("Server", id as Snowflake, did, uuid) as Server ?? undefined;
	}

	public async getOrFetchUser(id: Optional<string>, did?: Optional<Snowflake>, uuid?: Optional<UUID>): Promise<User | undefined> {
		return await this.core.repo.getById("User", id as Snowflake, did, uuid) as User ?? undefined;
	}

	public async saveGame(game: Game): Promise<boolean> {
		return this.core.repo.write(game);
	}

	public async saveServer(server: Server): Promise<boolean> {
		return this.core.repo.write(server);
	}

	public async saveUser(user: User): Promise<boolean> {
		return this.core.repo.write(user);
	}

	//#region static

	protected static create(core: SageEventCacheCore): SageEventCache {
		return new SageEventCache(core);
	}

	private static async _fromMessage(messageOrPartial: MessageOrPartial, actorOrPartial: UserOrPartial, reactionOrPartial?: ReactionOrPartial): Promise<SageEventCache> {
		const evCache = await createSageEventCache({
			actorOrPartial,
			authorOrPartial: messageOrPartial.author ?? undefined,
			channel: messageOrPartial.channel,
			discord: DiscordCache.from(messageOrPartial),
			discordKey: DiscordKey.from(messageOrPartial),
			guild: messageOrPartial.guild ?? undefined,
			messageOrPartial,
			reactionOrPartial,
		});
		return evCache;
	}

	public static async fromMessage(messageOrPartial: MessageOrPartial): Promise<SageEventCache> {
		const message = await fetchIfPartial(messageOrPartial) as Message;
		const evCache = await SageEventCache._fromMessage(message, message.author);
		await evCache.validateActor();
		return evCache;
	}

	public static fromMessageReaction(reactionOrPartial: ReactionOrPartial, actorOrPartial: UserOrPartial): Promise<SageEventCache> {
		return SageEventCache._fromMessage(reactionOrPartial.message, actorOrPartial, reactionOrPartial);
	}

	public static async fromInteraction(interaction: DInteraction): Promise<SageEventCache> {
		const messageOrPartial = "message" in interaction ? interaction.message ?? undefined : undefined;
		const evCache = await createSageEventCache({
			actorOrPartial: interaction.user,
			authorOrPartial: messageOrPartial?.author ?? undefined,
			channel: interaction.channel ?? undefined,
			discord: DiscordCache.from(interaction),
			discordKey: DiscordKey.from(interaction as Interaction),
			guild: interaction.guild ?? undefined,
			messageOrPartial,
		});
		return evCache;
	}

	//#endregion
}
