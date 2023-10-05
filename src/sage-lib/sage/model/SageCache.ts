import type * as Discord from "discord.js";
import utils from "../../../sage-utils";
import { debug, silly } from "../../../sage-utils/utils/ConsoleUtils";
import { errorReturnFalse } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { DInteraction, DMessage, DReaction, DUser, DiscordCache, DiscordKey, NilSnowflake, TChannel } from "../../discord";
import { isDeleted } from "../../discord/deletedMessages";
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
	discordUser: DUser;

	bots: BotRepo;
	servers: ServerRepo;
	games: GameRepo;
	users: UserRepo;

	bot: Bot;
	home: Server;
	server: Server;
	game?: Game;
	user: User;

};

function createCoreAndCache(): [TSageCacheCore, SageCache] {
	const core: TSageCacheCore = <TSageCacheCore><Partial<TSageCacheCore>>{ },
		sageCache = new SageCache(core);
	core.bots = new BotRepo(sageCache);
	core.servers = new ServerRepo(sageCache);
	core.games = new GameRepo(sageCache);
	core.users = new UserRepo(sageCache);
	return [core, sageCache];
}

type DMessageChannel = Discord.DMChannel | Discord.PartialDMChannel | Discord.NewsChannel | Discord.TextChannel | Discord.ThreadChannel;
export async function canSendMessageTo(channel: DMessageChannel): Promise<boolean> {
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

// type TMeta = {
// 	diceSent?: [];
// 	messagesDeleted?: Discord.Message[];
// 	messagesSent?: Discord.Message[];
// };

export default class SageCache {
	constructor(protected core: TSageCacheCore) { }

	/** Clears the cache/maps in an attempt to avoid memory leaks. */
	public clear(): void {
		debug("Clearing SageCache");
		this.canSendMessageToMap.clear();
		this.hasTupperMap.clear();
		this.canReactToMap.clear();
		this.canWebhookToMap.clear();
		this.discord.clear();
	}

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

	private hasTupperMap = new Map<string, boolean>();
	public async hasTupper(discordKey: DiscordKey): Promise<boolean> {
		const key = discordKey.key;
		if (!this.hasTupperMap.has(key)) {
			this.hasTupperMap.set(key, await _hasTupper(this, discordKey).catch(errorReturnFalse));
		}
		return this.hasTupperMap.get(key) ?? false;

		async function _hasTupper(sageCache: SageCache, discordKey: DiscordKey): Promise<boolean> {
			if (!discordKey.hasServer) return false;

			const tupperId = "431544605209788416";

			const guild = await sageCache.discord.fetchGuild(discordKey.server);
			if (!guild) return false;
			if (!guild.members.cache.has(tupperId)) return false;

			// const tupper = await sageCache.discord.fetchGuildMember(tupperId);
			// // debug({tupperId,tupper:!!tupper});
			// if (!tupper) return false;

			const thread = await sageCache.discord.fetchChannel<Discord.ThreadChannel>(discordKey.thread);
			// debug({tupperId,tupper:!!tupper,threadId:discordKey.thread,thread:!!thread?.guildMembers.has(tupperId)});
			if (thread?.guildMembers.has(tupperId)) return true;

			const channel = await sageCache.discord.fetchChannel<Discord.TextChannel>(discordKey.channel);
			// debug({tupperId,tupper:!!tupper,threadId:discordKey.thread,thread:!!thread?.guildMembers.has(tupperId),channelId:discordKey.channel,channel:!!channel?.members.has(tupperId)});
			return channel?.members.has(tupperId) === true;
		}
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
				if (isDeleted(discordKey.message)) return false; // keep checking before and after each fetch
				const thread = await sageCache.discord.fetchChannel(discordKey.thread);
				if (isDeleted(discordKey.message)) return false; // keep checking before and after each fetch
				const channel = await sageCache.discord.fetchChannel<Discord.TextChannel>(discordKey.channel);
				if (isDeleted(discordKey.message)) return false; // keep checking before and after each fetch
				const botUser = await sageCache.discord.fetchUser(ActiveBot.active.did);
				if (isDeleted(discordKey.message)) return false; // keep checking before and after each fetch
				if (botUser && (thread || channel)) {
					const reactPerm = "ADD_REACTIONS";
					const perms = channel?.permissionsFor(botUser);
					return perms?.has(reactPerm) ?? true;
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
	/** @deprecated start setting this.core.discordUser or remove it! */
	public get userDid(): Discord.Snowflake { return this.core.discordUser?.id ?? this.core.user?.did ?? NilSnowflake; }

	// public meta: TMeta[] = [];

	public get bots(): BotRepo { return this.core.bots; }
	public get servers(): ServerRepo { return this.core.servers; }
	public get games(): GameRepo { return this.core.games; }
	public get users(): UserRepo { return this.core.users; }

	public get bot(): Bot { return this.core.bot; }
	public get home(): Server { return this.core.home; }
	public get server(): Server { return this.core.server; }
	public get game(): Game | undefined { return this.core.game; }
	public get user(): User { return this.core.user; }

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

	// protected static create<T extends IHandlerCachesCore>(core: T): HandlerCaches<T> {
	// 	return new HandlerCaches(core);
	// }
	protected static create(core: TSageCacheCore): SageCache {
		return new SageCache(core);
	}

	public static async fromClient(client: Discord.Client): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = new DiscordCache(client, null);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		return sageCache;
	}
	public static async fromGuildMember(guildMember: Discord.GuildMember): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = DiscordCache.fromGuildMember(guildMember);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		if (guildMember.guild) {
			core.server = await core.servers.getOrCreateByGuild(guildMember.guild);
		}
		core.user = await core.users.getOrCreateByDid(guildMember.id);
		return sageCache;
	}
	public static async fromMessage(message: DMessage, userDid: Discord.Snowflake = message.author?.id ?? NilSnowflake): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = DiscordCache.fromMessage(message);
		core.discordKey = DiscordKey.fromMessage(message);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		if (message.guild) {
			core.server = await core.servers.getOrCreateByGuild(message.guild);
			core.game = await core.games.findActiveByDiscordKey(core.discordKey);
		}
		core.user = await core.users.getOrCreateByDid(userDid);
		return sageCache;
	}
	public static async fromMessageReaction(messageReaction: DReaction, user: DUser): Promise<SageCache> {
		return SageCache.fromMessage(messageReaction.message, user.id);
	}
	public static async fromInteraction(interaction: DInteraction): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = DiscordCache.fromInteraction(interaction);
		core.discordKey = DiscordKey.fromInteraction(interaction);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		if (interaction.guild) {
			core.server = await core.servers.getOrCreateByGuild(interaction.guild);
			core.game = await core.games.findActiveByDiscordKey(core.discordKey);
		}
		core.user = await core.users.getOrCreateByDid(interaction.user.id);
		return sageCache;
	}

}
