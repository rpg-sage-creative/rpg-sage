import type * as Discord from "discord.js";
import utils, { UUID } from "../../../sage-utils";
import { DInteraction, DiscordCache, DiscordKey, DMessage, DReaction, DUser, NilSnowflake, TChannel } from "../../discord";
import ActiveBot from "../model/ActiveBot";
import BotRepo from "../repo/BotRepo";
import GameRepo from "../repo/GameRepo";
import ServerRepo from "../repo/ServerRepo";
import UserRepo from "../repo/UserRepo";
import type Bot from "./Bot";
import type Game from "./Game";
import type Server from "./Server";
import type User from "./User";

export type TSageCacheCore = {
	discord: DiscordCache;
	discordKey: DiscordKey;

	bots: BotRepo;
	servers: ServerRepo;
	games: GameRepo;
	users: UserRepo;

	/** The User objects for the actor doing the thing. */
	actor: TSageDiscordPair<DUser, User>;

	/** The User objects for the author of the message. */
	author?: TSageDiscordPair<DUser, User>;

	bot: Bot;

	channel?: TChannel;

	game?: Game;

	/** RPG Sage's home Discord server */
	home: Server;

	/** Sage ServerGuild objects being acted in/upon. */
	server?: TSageDiscordPair<Discord.Guild, Server>;

};

/** This object's id is a Discord Snowflake. */
type THasShowflakeId = { id:Discord.Snowflake; };

/** This object's id is a UUID. */
type THasUuidId = { id:UUID; };

/** This object represents a pairing of a Sage object and its corresponding Discord object. */
export type TSageDiscordPair<T extends THasShowflakeId, U extends THasUuidId> = {
	/** Discord object */
	d: T;
	/** Snowflake representing the Discord object */
	did: Discord.Snowflake;
	/** UUID representing the Sage object */
	uuid: UUID;
	/** Sage object */
	s: U;
};

/** Helper for creating TSageDiscordPair objects. */
function pair<D extends THasShowflakeId, S extends THasUuidId>(d: D, s: S): TSageDiscordPair<D, S> {
	return { d, did:d.id, uuid:s.id, s };
}

/** Helper for creating SageCache that returns both it and its core for extending. */
function createCoreAndCache(): { core:TSageCacheCore, sageCache:SageCache } {
	const core: TSageCacheCore = <TSageCacheCore><Partial<TSageCacheCore>>{ },
		sageCache = new SageCache(core);
	core.bots = new BotRepo(sageCache);
	core.servers = new ServerRepo(sageCache);
	core.games = new GameRepo(sageCache);
	core.users = new UserRepo(sageCache);
	return { core, sageCache };
}

/** Convenience type for the possible channels that we might see. */
type DMessageChannel = Discord.DMChannel | Discord.PartialDMChannel | Discord.NewsChannel | Discord.TextChannel | Discord.ThreadChannel;

/**
 * Determines if we can send messages to the given channel.
 * If not a text channel, always false.
 * If a DM channel, always true.
 * Otherwise, we check the bot's perms to see if it has SEND_MESSAGES or SEND_MESSAGES_IN_THREADS as appropriate.
 * @param channel
 * @returns true if we can send to the channel
 */
export function canSendMessageTo(channel: DMessageChannel): boolean {
	if (!channel.isText()) {
		return false;
	}
	if (channel.type !== "DM") {
		const perms = channel.permissionsFor(ActiveBot.active.did);
		if (perms) {
			if (channel.isThread()) {
				return perms.has("SEND_MESSAGES_IN_THREADS") ?? false;
			}
			return perms.has("SEND_MESSAGES") ?? false;
		}
	}
	return true;
}

type TMeta = {
	diceSent?: [];
	messagesDeleted?: Discord.Message[];
	messagesSent?: Discord.Message[];
};

export default class SageCache {
	constructor(protected core: TSageCacheCore) { }

	private canSendMessageToMap = new Map<string, boolean>();
	public async canSendMessageTo(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.canSendMessageToMap.has(key)) {
			if (discordKey.isDm) {
				this.canSendMessageToMap.set(key, true);
			}else {
				const thread = await this.discord.fetchChannel(discordKey.thread);
				const channel = await this.discord.fetchChannel<Discord.TextChannel>(discordKey.channel);
				const botUser = await this.discord.fetchUser(ActiveBot.active.did);
				if (botUser && (thread || channel)) {
					const sendPerm = thread ? "SEND_MESSAGES_IN_THREADS" : "SEND_MESSAGES";
					const perms = channel?.permissionsFor(botUser);
					this.canSendMessageToMap.set(key, perms?.has(sendPerm) ?? true);
				}else {
					this.canSendMessageToMap.set(key, false);
				}
			}
		}
		return this.canSendMessageToMap.get(key)!;
	}

	private canReactToMap = new Map<string, boolean>();
	public async canReactTo(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.canReactToMap.has(key)) {
			if (discordKey.isDm) {
				this.canReactToMap.set(key, true);
			}else {
				const thread = await this.discord.fetchChannel(discordKey.thread);
				const channel = await this.discord.fetchChannel<Discord.TextChannel>(discordKey.channel);
				const botUser = await this.discord.fetchUser(ActiveBot.active.did);
				if (botUser && (thread || channel)) {
					const reactPerm = "ADD_REACTIONS";
					const perms = channel?.permissionsFor(botUser);
					this.canReactToMap.set(key, perms?.has(reactPerm) ?? true);
				}else {
					this.canReactToMap.set(key, false);
				}
			}
		}
		return this.canReactToMap.get(key)!;
	}

	private canWebhookToMap = new Map<string, boolean>();
	public async canWebhookTo(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.canWebhookToMap.has(key)) {
			if (discordKey.isDm) {
				this.canWebhookToMap.set(key, false);
			}else {
				const thread = await this.discord.fetchChannel(discordKey.thread);
				const channel = await this.discord.fetchChannel<Discord.TextChannel>(discordKey.channel);
				const botUser = await this.discord.fetchUser(ActiveBot.active.did);
				if (botUser && (thread || channel)) {
					const sendPerm = thread ? "SEND_MESSAGES_IN_THREADS" : "SEND_MESSAGES";
					const hookPerm = "MANAGE_WEBHOOKS";
					const perms = channel?.permissionsFor(ActiveBot.active.did);
					this.canWebhookToMap.set(key, (perms?.has(sendPerm) ?? true) && (perms?.has(hookPerm) ?? true));
				}else {
					this.canWebhookToMap.set(key, false);
				}
			}
		}
		return this.canWebhookToMap.get(key)!;
	}

	public get discord(): DiscordCache { return this.core.discord; }
	public get discordKey(): DiscordKey { return this.core.discordKey; }

	public meta: TMeta[] = [];

	public get bots(): BotRepo { return this.core.bots; }
	public get servers(): ServerRepo { return this.core.servers; }
	public get games(): GameRepo { return this.core.games; }
	public get users(): UserRepo { return this.core.users; }

	public get bot(): Bot { return this.core.bot; }
	public get home(): Server { return this.core.home; }

	public get guild(): TSageDiscordPair<Discord.Guild, Server> | undefined { return this.core.server; }
	public get server(): Server | undefined { return this.core.server?.s; }

	public get channel(): TChannel | undefined { return this.core.channel; }

	public get game(): Game | undefined { return this.core.game; }

	/** The User objects for the actor doing the thing. */
	public get actor(): TSageDiscordPair<DUser, User> { return this.core.actor; }

	/** The User objects for the author of the message. */
	public get author(): TSageDiscordPair<DUser, User> | undefined	{ return this.core.author; }

	//#region deprecated

	/** @deprecated Use .actor.s */
	public get user(): User { return this.core.actor.s; }
	/** @deprecated Use .actor.did */
	public get userDid(): Discord.Snowflake { return this.core.actor.d.id ?? NilSnowflake; }

	//#endregion

	private clone(core: TSageCacheCore): SageCache {
		return new SageCache(core);
	}
	public cloneForChannel(channel: TChannel): SageCache {
		const core = { ...this.core };
		core.discordKey = DiscordKey.fromChannel(channel);
		return this.clone(core);
	}

	public cloneForMessage(message: DMessage): SageCache {
		const core = { ...this.core };
		core.discordKey = DiscordKey.fromMessage(message);
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
		return utils.StringUtils.Markdown.format(this.emojify(text));
	}
	public getPrefixOrDefault(): string {
		return this.server?.getPrefixOrDefault() ?? "";
	}

	protected static create(core: TSageCacheCore): SageCache {
		return new SageCache(core);
	}

	public static async fromClient(client: Discord.Client): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = new DiscordCache(client, null);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		return sageCache;
	}
	public static async fromGuildMember(guildMember: Discord.GuildMember): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordCache.fromGuildMember(guildMember);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		if (guildMember.guild) {
			core.server = pair(guildMember.guild, await core.servers.getOrCreateByGuild(guildMember.guild));
		}
		core.actor = pair(guildMember.user, await core.users.getOrCreateByDid(guildMember.id));
		return sageCache;
	}
	public static async fromMessage(message: DMessage, discordActor: DUser = message.author!): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordCache.fromMessage(message);
		core.discordKey = DiscordKey.fromMessage(message);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		if (message.guild) {
			core.channel = message.channel as TChannel;
			core.server = pair(message.guild, await core.servers.getOrCreateByGuild(message.guild));
			core.game = await core.games.findActiveByDiscordKey(core.discordKey);
		}
		core.actor = pair(discordActor, await core.users.getOrCreateByDid(discordActor.id));
		core.author = message.author ? pair(message.author, await core.users.getOrCreateByDid(message.author.id)) : undefined;
		return sageCache;
	}
	public static async fromMessageReaction(messageReaction: DReaction, discordActor: DUser): Promise<SageCache> {
		return SageCache.fromMessage(messageReaction.message, discordActor);
	}
	public static async fromInteraction(interaction: DInteraction): Promise<SageCache> {
		const { core, sageCache } = createCoreAndCache();
		core.discord = DiscordCache.fromInteraction(interaction);
		core.discordKey = DiscordKey.fromInteraction(interaction);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		if (interaction.guild) {
			core.channel = interaction.channel as TChannel;
			core.server = pair(interaction.guild, await core.servers.getOrCreateByGuild(interaction.guild));
			core.game = await core.games.findActiveByDiscordKey(core.discordKey);
		}
		core.actor = pair(interaction.user, await core.users.getOrCreateByDid(interaction.user.id));
		core.author = !interaction.isApplicationCommand() ? pair(interaction.message.author as DUser, await core.users.getOrCreateByDid(interaction.message.author.id)) : undefined;
		return sageCache;
	}

}
