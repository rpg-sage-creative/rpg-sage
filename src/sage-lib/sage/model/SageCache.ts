import { getTupperBoxId } from "@rsc-sage/env";
import { debug, errorReturnFalse, errorReturnUndefined, orNilSnowflake, parseUuid, silly, uncache, warn, type Optional, type RenderableContentResolvable, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { canSendMessageTo, DiscordCache, DiscordKey, fetchIfPartial, getPermsFor, isDiscordApiError, toHumanReadable, type DInteraction, type MessageChannel, type MessageOrPartial, type MessageReferenceOrPartial, type MessageTarget, type ReactionOrPartial, type SMessage, type UserOrPartial } from "@rsc-utils/discord-utils";
import { toMarkdown } from "@rsc-utils/string-utils";
import type { Channel, User as DUser, Guild, GuildMember, Interaction, Message } from "discord.js";
import { getLocalizedText, type Localizer } from "../../../sage-lang/getLocalizedText.js";
import { isDeleted } from "../../discord/deletedMessages.js";
import { send } from "../../discord/messages.js";
import { ActiveBot } from "../model/ActiveBot.js";
import { GameRepo } from "../repo/GameRepo.js";
import { ServerRepo } from "../repo/ServerRepo.js";
import { UserRepo } from "../repo/UserRepo.js";
import type { Bot } from "./Bot.js";
import { GameRoleType, type Game } from "./Game.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

export type SageCacheCore = {
	actor: SageCacheUser;
	/** actor of an event */
	actorOrPartial: UserOrPartial;
	author: SageCacheUser;
	/** author of the message being acted upon */
	authorOrPartial?: UserOrPartial;
	discord: DiscordCache;
	discordKey: DiscordKey;
	game?: Game;
	games: GameRepo;
	home: Server;
	/** message of a post or interaction */
	messageOrPartial?: MessageOrPartial;
	/** reaction of a reaction */
	reactionOrPartial?: ReactionOrPartial;
	server: SageCacheServer;
	servers: ServerRepo;
	users: UserRepo;
};

/**
 * @todo have ensureActor(), ensureGame(), ensureGuild()
 * Move isGameX to EnsuredGame
 * Move canManageServer, member to EnsuredGuild
 */

type KnownUser = {
	canManageServer: boolean;
	discord: DUser;
	id: Snowflake;
	isGameMaster: boolean;
	isGamePlayer: boolean;
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
	known?: never;
	member?: never;
	sage: User;
	uuid?: never;
};
type SageCacheUser = UnvalidatedUser | UnknownUser | KnownUser;

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
async function validateUser(sageCache: SageCache, { which, actorOrPartial, authorOrPartial, messageOrPartial, reactionOrPartial }: ValidateUserArgs): Promise<SageCacheUser> {

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
	const sage = await sageCache.users.getOrCreateByDid(orNilSnowflake(discord?.id));

	// set flags as false by default
	let canManageServer = false;
	let isGameMaster = false;
	let isGamePlayer = false;

	// we don't have a valid discord user (or we couldn't fetch it for some reason)
	if (!discord?.id) {
		const unknownUser: UnknownUser = {
			canManageServer,
			id: undefined,
			isGameMaster,
			isGamePlayer,
			known: false,
			sage,
		};
		return unknownUser;
	}

	// type cast id now
	const id = discord.id as Snowflake

	// we need a guildmember to check server perms
	let member: GuildMember | undefined;
	const guild = sageCache.server?.discord;
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
		canManageServer = guild.ownerId === id || member?.permissions.has("Administrator") === true || member?.permissions.has("ManageGuild") === true
	}

	// now let's check for game access
	const { game } = sageCache;
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
		known: true,
		member,
		sage,
		uuid,
	};
	return knownUser;
}

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
type SageCacheServer = UnvalidatedServer | DmServer | UnknownServer | KnownServer;

async function validateServer(sageCache: SageCache, discord: Optional<Guild>): Promise<SageCacheServer> {
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
	const sage = await sageCache.servers.getOrCreateByGuild(discord);

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

type SageCacheCreateOptions = {
	actorOrPartial: UserOrPartial;
	authorOrPartial: UserOrPartial | undefined;
	channel: Channel | undefined;
	discord: DiscordCache;
	discordKey: DiscordKey;
	guild: Guild | undefined;
	messageOrPartial: MessageOrPartial | undefined;
	reactionOrPartial?: ReactionOrPartial;
};

async function createSageCache(options: SageCacheCreateOptions): Promise<SageCache> {
	const { actorOrPartial, authorOrPartial, channel, discord, discordKey, guild, messageOrPartial, reactionOrPartial } = options;

	const core: SageCacheCore = {
		actor: undefined!, // below
		actorOrPartial,
		author: undefined!,
		authorOrPartial,
		discord,
		discordKey,
		game: undefined,
		games: undefined!, // below
		home: undefined!, // below
		messageOrPartial,
		reactionOrPartial,
		server: undefined!, // below
		servers: undefined!, // below
		users: undefined!, // below
	};

	const sageCache = new SageCache(core);

	core.servers = new ServerRepo(sageCache);
	core.games = new GameRepo(sageCache);
	core.users = new UserRepo(sageCache);

	core.home = await core.servers.getHome();

	// set unvalidated actor
	core.actor = { sage:await core.users.getOrCreateByDid(actorOrPartial.id as Snowflake) };

	// set unvalidated author
	core.author = { sage:await core.users.getOrCreateByDid(orNilSnowflake(authorOrPartial?.id)) };

	// set unvalidated server
	core.server = { discord:guild };

	// we only do games when we have a guild/server
	if (guild) {

		// validate the server to look for the game
		await sageCache.validate("server");

		const { server } = sageCache;
		if (server.known) {
			// check to see if we have a server-wide game
			if (server.sage.gameId) {
				const game = await core.games.getById(server.sage.gameId as Snowflake);
				if (game && !game.isArchived) {
					core.game = game;
				}
			}

			// fall back to the active game for the channel
			if (!core.game && channel) {
				core.game = await core.games.findActive(channel);
			}
		}

	}

	return sageCache;
}

export class SageCache {
	constructor(protected core: SageCacheCore) { }

	/** Clears the cache/maps in an attempt to avoid memory leaks. */
	public clear(): void {
		debug("Clearing SageCache");
		this.canSendMessageToMap.clear();
		this.hasTupperMap.clear();
		this.canReactToMap.clear();
		this.canWebhookToMap.clear();
		uncache(this.core);
	}

	/** Convenience method for send(SageCache, MessageTarget, RenderableContentResolvable, Optional<DUser>) */
	public send(targetChannel: MessageTarget, renderableContent: RenderableContentResolvable, originalAuthor: Optional<DUser>): Promise<SMessage[]> {
		return send(this, targetChannel, renderableContent, originalAuthor);
	}

	/** User that created the message. */
	public get author(): SageCacheUser { return this.core.author; }

	/** User doing the action. */
	public get actor(): SageCacheUser { return this.core.actor; }

	/** Guild/Server the event happens in. */
	public get server(): SageCacheServer { return this.core.server; }

	public async validate(which?: "actor" | "author" | "server"): Promise<boolean> {
		if (which === "actor") {
			if (this.core.actor.known === undefined) {
				const { actorOrPartial, messageOrPartial, reactionOrPartial } = this.core;
				this.core.actor = await validateUser(this, { which:"actor", actorOrPartial, messageOrPartial, reactionOrPartial });
			}
			return this.core.actor.known === true;

		}else if (which === "author") {
			if (this.core.author.known === undefined) {
				const { authorOrPartial, messageOrPartial, reactionOrPartial } = this.core;
				this.core.author = await validateUser(this, { which:"author", authorOrPartial, messageOrPartial, reactionOrPartial });
			}
			return this.core.author.known === true;

		}else {
			if (this.core.server.known === undefined) {
				this.core.server = await validateServer(this, this.core.server.discord);
			}
			return this.core.server.known === true;
		}
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

		async function _canReactTo(sageCache: SageCache, discordKey: DiscordKey): Promise<boolean> {
			if (discordKey.isDm) {
				return true;
			}else {
				const { thread, channel } = await sageCache.discord.fetchChannelAndThread(discordKey);
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
	/** @deprecated start setting this.core.discordUser or remove it! */
	public get userDid(): Snowflake { return this.core.actor.sage.did; }

	// public meta: TMeta[] = [];

	public get servers(): ServerRepo { return this.core.servers; }
	public get games(): GameRepo { return this.core.games; }
	public get users(): UserRepo { return this.core.users; }

	public get bot(): Bot { return ActiveBot.active; }
	public get home(): Server { return this.core.home; }
	public get game(): Game | undefined { return this.core.game; }
	public get user(): User { return this.core.actor.sage; }

	private clone(core: SageCacheCore): SageCache {
		return new SageCache(core);
	}

	public cloneForChannel(channel: Optional<MessageTarget>): SageCache {
		const core = { ...this.core };
		if (channel) {
			core.discordKey = DiscordKey.from(channel);
		}else {
			warn(`Invalid Channel in cloneForChannel`);
		}
		return this.clone(core);
	}

	public cloneForMessage(message: MessageOrPartial): SageCache {
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

	public async fetchMessage(keyOrReference: DiscordKey | MessageReferenceOrPartial): Promise<Message | undefined> {
		return this.discord.fetchMessage(keyOrReference, this.user?.did);
	}

	// protected static create<T extends IHandlerCachesCore>(core: T): HandlerCaches<T> {
	// 	return new HandlerCaches(core);
	// }
	protected static create(core: SageCacheCore): SageCache {
		return new SageCache(core);
	}

	// public static async fromClient(client: Client): Promise<SageCache> {
	// 	return createSageCache({
	// 		discord: DiscordCache.from({ client, guild:null }),
	// 	} as SageCacheCreateOptions);
	// }

	private static async _fromMessage(messageOrPartial: MessageOrPartial, actorOrPartial: UserOrPartial, reactionOrPartial?: ReactionOrPartial): Promise<SageCache> {
		const sageCache = await createSageCache({
			actorOrPartial,
			authorOrPartial: messageOrPartial.author ?? undefined,
			channel: messageOrPartial.channel,
			discord: DiscordCache.from(messageOrPartial),
			discordKey: DiscordKey.from(messageOrPartial),
			guild: messageOrPartial.guild ?? undefined,
			messageOrPartial,
			reactionOrPartial,
		});
		return sageCache;
	}

	public static async fromMessage(messageOrPartial: MessageOrPartial): Promise<SageCache> {
		const message = await fetchIfPartial(messageOrPartial) as Message;
		const sageCache = await SageCache._fromMessage(message, message.author);
		await sageCache.validate("actor");
		return sageCache;
	}

	public static fromMessageReaction(reactionOrPartial: ReactionOrPartial, actorOrPartial: UserOrPartial): Promise<SageCache> {
		return SageCache._fromMessage(reactionOrPartial.message, actorOrPartial, reactionOrPartial);
	}

	public static async fromInteraction(interaction: DInteraction): Promise<SageCache> {
		const messageOrPartial = "message" in interaction ? interaction.message ?? undefined : undefined;
		const sageCache = await createSageCache({
			actorOrPartial: interaction.user,
			authorOrPartial: messageOrPartial?.author ?? undefined,
			channel: interaction.channel ?? undefined,
			discord: DiscordCache.from(interaction),
			discordKey: DiscordKey.from(interaction as Interaction),
			guild: interaction.guild ?? undefined,
			messageOrPartial,
		});
		return sageCache;
	}

}
