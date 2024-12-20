import { getTupperBoxId } from "@rsc-sage/env";
import { uncache } from "@rsc-utils/cache-utils";
import { debug, errorReturnFalse, orNilSnowflake, silly, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { canSendMessageTo, DiscordKey, type DInteraction, type MessageChannel, type MessageOrPartial, type MessageTarget, type ReactionOrPartial, type UserOrPartial } from "@rsc-utils/discord-utils";
import { toMarkdown } from "@rsc-utils/string-utils";
import type { Channel, Client, Interaction, Message, MessageReference } from "discord.js";
import { getLocalizedText, type LocalizedTextKey } from "../../../sage-lang/getLocalizedText.js";
import { DiscordCache } from "../../discord/DiscordCache.js";
import { isDeleted } from "../../discord/deletedMessages.js";
import { getPermsFor } from "../../discord/permissions/getPermsFor.js";
import { ActiveBot } from "../model/ActiveBot.js";
import { BotRepo } from "../repo/BotRepo.js";
import { GameRepo } from "../repo/GameRepo.js";
import { ServerRepo } from "../repo/ServerRepo.js";
import { UserRepo } from "../repo/UserRepo.js";
import type { Bot } from "./Bot.js";
import type { Game } from "./Game.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

export type TSageCacheCore = {
	discord: DiscordCache;
	discordKey: DiscordKey;
	discordUser: UserOrPartial;

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

// type TMeta = {
// 	diceSent?: [];
// 	messagesDeleted?: Message[];
// 	messagesSent?: Message[];
// };

export class SageCache {
	constructor(protected core: TSageCacheCore) { }

	/** Clears the cache/maps in an attempt to avoid memory leaks. */
	public clear(): void {
		debug("Clearing SageCache");
		this.canSendMessageToMap.clear();
		this.hasTupperMap.clear();
		this.canReactToMap.clear();
		this.canWebhookToMap.clear();
		uncache(this.core);
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
	public cloneForChannel(channel: MessageTarget): SageCache {
		const core = { ...this.core };
		core.discordKey = DiscordKey.from(channel);
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

	public getLocalizer() {
		const lang = this.user.preferredLang ?? "en-US";
		return (key: LocalizedTextKey, ...args: (string | number)[]) => getLocalizedText(key, lang, ...args);
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
	protected static create(core: TSageCacheCore): SageCache {
		return new SageCache(core);
	}

	public static async fromClient(client: Client): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = DiscordCache.from({ client, guild:null });
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
		return sageCache;
	}
	// public static async fromGuildMember(guildMember: GuildMember): Promise<SageCache> {
	// 	const [core, sageCache] = createCoreAndCache();
	// 	core.discord = DiscordCache.from(guildMember);
	// 	core.bot = ActiveBot.active;
	// 	core.home = await core.servers.getHome();
	// 	if (guildMember.guild) {
	// 		core.server = await core.servers.getOrCreateByGuild(guildMember.guild);
	// 	}
	// 	core.user = await core.users.getOrCreateByDid(guildMember.id as Snowflake);
	// 	return sageCache;
	// }
	public static async fromMessage(message: MessageOrPartial, userDid = message.author?.id): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = DiscordCache.from(message);
		core.discordKey = DiscordKey.from(message);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
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
		core.user = await core.users.getOrCreateByDid(orNilSnowflake(userDid));
		return sageCache;
	}
	public static async fromMessageReaction(messageReaction: ReactionOrPartial, user: UserOrPartial): Promise<SageCache> {
		return SageCache.fromMessage(messageReaction.message, user.id);
	}
	public static async fromInteraction(interaction: DInteraction): Promise<SageCache> {
		const [core, sageCache] = createCoreAndCache();
		core.discord = DiscordCache.from(interaction);
		core.discordKey = DiscordKey.from(interaction as Interaction);
		core.bot = ActiveBot.active;
		core.home = await core.servers.getHome();
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
