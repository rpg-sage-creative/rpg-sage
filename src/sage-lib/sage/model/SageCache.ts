import { getTupperBoxId } from "@rsc-sage/env";
import { debug, errorReturnFalse, errorReturnNull, orNilSnowflake, parseUuid, silly, uncache, warn, type Optional, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { canSendMessageTo, DiscordCache, DiscordKey, fetchIfPartial, getPermsFor, isDiscordApiError, toHumanReadable, type DInteraction, type MessageChannel, type MessageOrPartial, type MessageTarget, type ReactionOrPartial, type UserOrPartial } from "@rsc-utils/discord-utils";
import { toMarkdown } from "@rsc-utils/string-utils";
import type { Channel, Client, User as DUser, Guild, GuildMember, Interaction, Message, MessageReference } from "discord.js";
import { getLocalizedText, type Localizer } from "../../../sage-lang/getLocalizedText.js";
import { isDeleted } from "../../discord/deletedMessages.js";
import { ActiveBot } from "../model/ActiveBot.js";
import { GameRepo } from "../repo/GameRepo.js";
import { ServerRepo } from "../repo/ServerRepo.js";
import { UserRepo } from "../repo/UserRepo.js";
import type { Bot } from "./Bot.js";
import { GameRoleType, type Game } from "./Game.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

export type SageCacheCore = {
	discord: DiscordCache;
	discordKey: DiscordKey;
	discordUser: UserOrPartial;

	servers: ServerRepo;
	games: GameRepo;
	users: UserRepo;

	bot: Bot;
	home: Server;
	server: Server;
	game?: Game;
	user: User;

	actor?: EnsuredUser;
	author?: EnsuredUser;
	_server?: EnsuredServer;

	/** message of a post or interaction */
	messageOrPartial?: MessageOrPartial;
	/** reaction of a reaction */
	reactionOrPartial?: ReactionOrPartial;
	/** actor of a reaction or interaction */
	userOrPartial?: UserOrPartial;
};

/**
 * @todo have ensureActor(), ensureGame(), ensureGuild()
 * Move isGameX to EnsuredGame
 * Move canManageServer, member to EnsuredGuild
 */

type EnsuredUser = {
	canManageServer: boolean;
	discord?: DUser;
	id?: Snowflake;
	isGameMaster: boolean;
	isGamePlayer: boolean;
	member?: GuildMember;
	sage?: User;
	uuid?: UUID;
};

type EnsuredServer = {
	discord?: Guild;
	id?: Snowflake;
	sage?: Server;
};

async function createCoreAndCache(): Promise<[SageCacheCore, SageCache]> {
	const core: SageCacheCore = <SageCacheCore><Partial<SageCacheCore>>{ };
	const sageCache = new SageCache(core);

	core.servers = new ServerRepo(sageCache);
	core.games = new GameRepo(sageCache);
	core.users = new UserRepo(sageCache);

	core.bot = ActiveBot.active;
	core.home = await core.servers.getHome();

	return [core, sageCache];
}

// type TMeta = {
// 	diceSent?: [];
// 	messagesDeleted?: Message[];
// 	messagesSent?: Message[];
// };

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

	/** User that created the message. */
	public get author(): EnsuredUser | undefined { return undefined; }
	/** User doing the action. */
	public get actor(): EnsuredUser | undefined { return this.core.actor; }
	public async ensureActor(): Promise<boolean> {
		if (!this.core.actor) {
			const { userOrPartial, messageOrPartial, reactionOrPartial } = this.core;

			let discord = await fetchIfPartial(userOrPartial);
			if (!discord && !reactionOrPartial && messageOrPartial) {
				const message = await fetchIfPartial(messageOrPartial);
				discord = message?.author;
			}
			if (!discord && reactionOrPartial) {
				const reaction = await fetchIfPartial(reactionOrPartial);
				const message = await fetchIfPartial(reaction?.message);
				discord = message?.author;
			}
			discord = await fetchIfPartial(discord);

			const sage = await this.core.users.getByDid(discord?.id as Snowflake) ?? undefined;
			const uuid = parseUuid(sage?.id);
			const guild = await this.ensureGuild() ? this.core._server?.discord : undefined;
			const member = discord?.id && !discord.bot && !discord.system ? await guild?.members.fetch(discord.id).catch(err => {
				return isDiscordApiError(err, 10007, 10013)
					? errorReturnNull(`guild.id = ${guild.id} (${guild.name}); guildMember.id = ${discord.id} (${toHumanReadable(discord)})`) ?? undefined
					: errorReturnNull(err) ?? undefined
				}) : undefined;
			// NOTE: hasUser checks users and roles so is preferred
			const isGameMaster = discord ? await this.core.game?.hasUser(discord?.id, GameRoleType.GameMaster) ?? false : false;
			const isGamePlayer = discord ? await this.core.game?.hasUser(discord?.id, GameRoleType.Player) ?? false : false;
			const canManageServer = guild
				? guild.ownerId === discord?.id || member?.permissions.has("Administrator") === true || member?.permissions.has("ManageGuild") === true
				: false;

			this.core.actor = {
				canManageServer,
				discord,
				id: discord?.id as Snowflake,
				isGameMaster,
				isGamePlayer,
				member,
				sage,
				uuid,
			};
		}
		return !!this.core.actor.id;
	}
	public async ensureGuild(): Promise<boolean> {
		if (!this.core._server) {
			const sage = this.core.server;
			const id = sage?.did;
			const discord = id ? await this.discord.fetchGuild(id) : undefined;
			this.core._server = { discord, id, sage };
		}
		return !!this.core._server.discord;
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
	public get userDid(): Snowflake { return orNilSnowflake(this.core.discordUser?.id ?? this.core.user?.did); }

	// public meta: TMeta[] = [];

	public get servers(): ServerRepo { return this.core.servers; }
	public get games(): GameRepo { return this.core.games; }
	public get users(): UserRepo { return this.core.users; }

	public get bot(): Bot { return ActiveBot.active; }
	public get home(): Server { return this.core.home; }
	public get server(): Server { return this.core.server; }
	public get game(): Game | undefined { return this.core.game; }
	public get user(): User { return this.core.user; }

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
		const server = this.discordKey.isDm ? this.home : this.server;
		if (server) {
			return server.emojify(text);
		}
		return this.bot.emojify(text);
	}

	public format(text: string): string {
		return toMarkdown(this.emojify(text));
	}

	public getPrefixOrDefault(): string {
		return this.server?.getPrefixOrDefault() ?? "";
	}

	public getLocalizer(): Localizer {
		const lang = this.user.preferredLang ?? "en-US";
		return (key: any, ...args: any[]) => getLocalizedText(key, lang, ...args);
	}

	public async fetchChannel<T extends Channel = Channel>(channelId: Optional<Snowflake>): Promise<T | undefined> {
		if (!channelId) return undefined;
		const guildId = this.server?.did;
		if (guildId) {
			return this.discord.fetchChannel({ guildId, channelId });
		}
		return this.discord.fetchDmChannel({ channelId, userId:this.user.did }) as Promise<T>;
	}

	public async fetchMessage(keyOrReference: DiscordKey | MessageReference): Promise<Message | undefined> {
		return this.discord.fetchMessage(keyOrReference, this.user.did);
	}

	// protected static create<T extends IHandlerCachesCore>(core: T): HandlerCaches<T> {
	// 	return new HandlerCaches(core);
	// }
	protected static create(core: SageCacheCore): SageCache {
		return new SageCache(core);
	}

	public static async fromClient(client: Client): Promise<SageCache> {
		const [core, sageCache] = await createCoreAndCache();
		core.discord = DiscordCache.from({ client, guild:null });
		return sageCache;
	}
	// public static async fromGuildMember(guildMember: GuildMember): Promise<SageCache> {
	// 	const [core, sageCache] = await createCoreAndCache();
	// 	core.discord = DiscordCache.from(guildMember);
	// 	if (guildMember.guild) {
	// 		core.server = await core.servers.getOrCreateByGuild(guildMember.guild);
	// 	}
	// 	core.user = await core.users.getOrCreateByDid(guildMember.id as Snowflake);
	// 	return sageCache;
	// }
	public static async fromMessage(message: MessageOrPartial): Promise<SageCache> {
		const [core, sageCache] = await createCoreAndCache();

		core.messageOrPartial = message;

		core.discord = DiscordCache.from(message);
		core.discordKey = DiscordKey.from(message);

		if (message.guild) {
			core.server = await core.servers.getOrCreateByGuild(message.guild);
			// check to see if we have a server-wide game
			if (core.server.gameId) {
				const game = await core.games.getById(core.server.gameId as Snowflake);
				if (game && !game.isArchived) {
					core.game = game;
				}
			}
			// fall back to the active game for the channel
			if (!core.game) {
				core.game = await core.games.findActive(message);
			}
		}
		core.user = await core.users.getOrCreateByDid(orNilSnowflake(message.author?.id));

		await sageCache.ensureActor();

		return sageCache;
	}
	public static async fromMessageReaction(messageReaction: ReactionOrPartial, user: UserOrPartial): Promise<SageCache> {
		const [core, sageCache] = await createCoreAndCache();

		core.reactionOrPartial = messageReaction;
		core.userOrPartial = user;

		const { message } = messageReaction;
		core.discord = DiscordCache.from(message);
		core.discordKey = DiscordKey.from(message);

		if (message.guild) {
			core.server = await core.servers.getOrCreateByGuild(message.guild);
			// check to see if we have a server-wide game
			if (core.server.gameId) {
				const game = await core.games.getById(core.server.gameId as Snowflake);
				if (game && !game.isArchived) {
					core.game = game;
				}
			}
			// fall back to the active game for the channel
			if (!core.game) {
				core.game = await core.games.findActive(message);
			}
		}
		core.user = await core.users.getOrCreateByDid(orNilSnowflake(user.id));

		return sageCache;
	}
	public static async fromInteraction(interaction: DInteraction): Promise<SageCache> {
		const [core, sageCache] = await createCoreAndCache();

		core.messageOrPartial = "message" in interaction ? interaction.message ?? undefined : undefined;
		core.userOrPartial = interaction.user;

		core.discord = DiscordCache.from(interaction);
		core.discordKey = DiscordKey.from(interaction as Interaction);

		if (interaction.guild) {
			core.server = await core.servers.getOrCreateByGuild(interaction.guild);
			// check to see if we have a server-wide game
			if (core.server.gameId) {
				const game = await core.games.getById(core.server.gameId as Snowflake);
				if (game && !game.isArchived) {
					core.game = game;
				}
			}
			// fall back to the active game for the channel
			if (!core.game) {
				core.game = await core.games.findActive(interaction);
			}
		}
		core.user = await core.users.getOrCreateByDid(interaction.user.id as Snowflake);

		return sageCache;
	}

}
