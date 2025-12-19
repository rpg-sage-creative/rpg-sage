import type { Awaitable, Optional, Snowflake } from "@rsc-utils/core-utils";
import { NIL_SNOWFLAKE, error, isNonNilSnowflake } from "@rsc-utils/core-utils";
import { ChannelType, Client, DMChannel, Guild, GuildMember, Message, Role, User, Webhook, type Channel } from "discord.js";
import { DiscordApiError } from "./DiscordApiError.js";
import { DiscordKey } from "./DiscordKey.js";
import { getPermsFor } from "./permissions/getPermsFor.js";
import { resolveChannelReference, type CanBeChannelReferenceResolvable, type ChannelReferenceResolvable } from "./resolve/resolveChannelReference.js";
import { resolveGuildId, type CanBeGuildIdResolvable, type GuildIdResolvable } from "./resolve/resolveGuildId.js";
import { resolveRoleId, type CanBeRoleIdResolvable } from "./resolve/resolveRoleId.js";
import { resolveUserId, type CanBeUserIdResolvable } from "./resolve/resolveUserId.js";
import { isSupportedChannelOrParent, isSupportedMessagesChannel, isSupportedWebhookChannel, type SupportedChannelOrParent, type SupportedNonThreadChannel, type SupportedThreadChannel, type SupportedWebhookChannel } from "./types/typeGuards/isSupported.js";
import type { MessageReferenceOrPartial } from "./types/types.js";

//#region Helpers

const SageDialogWebhookName = "SageDialogWebhookName";

type ClientGuildResolvable = Guild
	| { client: Client; guild: Optional<Guild>; };

type ChannelAndThread = { channel?:SupportedNonThreadChannel; thread?:SupportedThreadChannel; };
type WebhookChannelAndThread = { channel:SupportedWebhookChannel; thread?:SupportedThreadChannel; };
type WebhookAndChannel = { webhook?:Webhook; channel?:SupportedWebhookChannel; hasPerms?:boolean; };

type WebhookOptions = { avatar?:string; name?:string; type?:"dialog" };

function createWebhookKey(channelReferenceResolvable: ChannelReferenceResolvable, name: string): string {
	const channelId = resolveChannelReference(channelReferenceResolvable);
	return `${channelId}-${name}`;
}

//#endregion

export class DiscordCache {

	#cached: Map<string, boolean>;

	private constructor(public client: Client, public guild?: Optional<Guild>, channel?: Optional<Channel>) {
		this.#cached = new Map();
		this.webhookMap = new Map();

		if (guild) {
			this.#cached.set(guild.id, true);
		}
		if (channel) {
			this.#cached.set(channel.id, true);
		}
	}

	/** Clears the cache/maps in an attempt to avoid memory leaks. */
	public clear(): void {
		this.#cached.clear();
		this.webhookMap.clear();
	}

	//#region channel

	/** @deprecated use fetchGuildChannel() */
	public async fetchChannel<T extends SupportedChannelOrParent = SupportedChannelOrParent>(resolvable: Optional<CanBeChannelReferenceResolvable>): Promise<T | undefined> {
		return this.fetchGuildChannel(resolvable);
	}
	public async fetchGuildChannel<T extends SupportedChannelOrParent = SupportedChannelOrParent>(resolvable: Optional<CanBeChannelReferenceResolvable>): Promise<T | undefined> {
		const { guildId, channelId } = resolveChannelReference(resolvable) ?? { };
		if (!channelId || !guildId) return undefined; //NOSONAR

		const guild = await this.fetchGuild(guildId);
		if (!guild) return undefined;

		const cache = this.#cached.has(channelId);
		const channel = await guild.channels.fetch(channelId, { cache, force:!cache }).catch(DiscordApiError.process);

		this.#cached.set(channelId, true);

		if (isSupportedChannelOrParent(channel)) {
			return channel as T;
		}

		if (channel) {
			error(`Fetched unsupported channel: ${ChannelType[channel.type]} ${channel.url}`);
		}

		return undefined;
	}

	public async fetchDmChannel({ userId, channelId }: { userId:Snowflake, channelId:Snowflake }): Promise<DMChannel | undefined> {
		const user = await this.fetchUser(userId);
		if (!user) return undefined;
		if (user.dmChannel?.id !== channelId) return undefined;

		const cache = this.#cached.has(channelId);

		const channel = await user.dmChannel.fetch(!cache).catch(DiscordApiError.process);

		this.#cached.set(channelId, true);

		return channel;
	}

	public async fetchChannelAndThread(resolvable: Optional<CanBeChannelReferenceResolvable>): Promise<ChannelAndThread> {
		const threadOrChannel = await this.fetchGuildChannel(resolvable);
		if (threadOrChannel?.isThread()) {
			const parentChannel = await this.fetchGuildChannel<SupportedNonThreadChannel>(threadOrChannel.parent);
			return { channel:parentChannel, thread:threadOrChannel };
		}
		if (threadOrChannel) {
			return { channel:threadOrChannel as SupportedNonThreadChannel };
		}
		return { };
	}

	//#endregion

	//#region guild

	public async fetchGuild(resolvable: Optional<CanBeGuildIdResolvable>): Promise<Guild | undefined> {
		const guildId = resolveGuildId(resolvable);
		if (!isNonNilSnowflake(guildId)) return undefined; //NOSONAR

		const cache = this.#cached.has(guildId);
		const guild = await this.client.guilds.fetch({ guild:guildId, cache, force:!cache }).catch(DiscordApiError.process);

		this.#cached.set(guildId, true);

		return guild;
	}

	//#endregion

	//#region guild preview

	public async fetchGuildName(resolvable: Optional<CanBeGuildIdResolvable>, defaultValue?: string): Promise<string> {
		const guildId = resolveGuildId(resolvable);
		if (!isNonNilSnowflake(guildId)) return defaultValue ?? "ERROR_FETCHING_GUILD"; //NOSONAR

		const cache = this.#cached.has(guildId);
		const guild = await this.client.guilds.fetch({ guild:guildId, cache, force:!cache }).catch(DiscordApiError.process);
		const guildPreview = guild ? undefined : await this.client.fetchGuildPreview(guildId).catch(DiscordApiError.process);

		this.#cached.set(guildId, true);

		return guild?.name ?? guildPreview?.name ?? defaultValue ?? "ERROR_FETCHING_GUILD";
	}

	//#endregion

	//#region guild member

	public async fetchGuildMember(resolvable: Optional<CanBeUserIdResolvable>): Promise<GuildMember | undefined> {
		if (!this.guild) return undefined; //NOSONAR

		const userId = resolveUserId(resolvable);
		if (!userId) return undefined; //NOSONAR

		const key = `${this.guild.id}-${userId}`;

		const cache = this.#cached.has(key);
		const guildMember = await this.guild?.members.fetch({ user:userId, cache, force:!cache }).catch(DiscordApiError.process);

		this.#cached.set(key, true);

		return guildMember;
	}

	//#endregion

	//#region guild member role

	public async fetchGuildMemberRole(userId: Snowflake, roleId: Snowflake): Promise<Role | undefined> {
		const guildMember = await this.fetchGuildMember(userId);
		return guildMember?.roles.cache.get(roleId);
	}

	//#endregion

	//#region message

	public async fetchMessage(keyOrReference: DiscordKey | MessageReferenceOrPartial, userId?: Snowflake): Promise<Message | undefined> {
		const discordKey = keyOrReference instanceof DiscordKey ? keyOrReference : DiscordKey.from(keyOrReference);
		const { messageId } = discordKey;
		if (!isNonNilSnowflake(messageId)) return undefined; //NOSONAR

		const cache = this.#cached.has(messageId);
		const channel = discordKey.isDm && userId
			? await this.fetchDmChannel({ userId, channelId:discordKey.channelId })
			: await this.fetchGuildChannel(discordKey);
		const message = isSupportedMessagesChannel(channel)
			? await channel.messages.fetch({ message:messageId, cache, force:!cache }).catch(DiscordApiError.process)
			: undefined;

		this.#cached.set(messageId, true);

		return message;
	}

	//#endregion

	//#region role

	public async fetchGuildRole(roleIdResolvable: Optional<CanBeRoleIdResolvable>): Promise<Role | undefined> {
		const roleId = resolveRoleId(roleIdResolvable);
		if (!isNonNilSnowflake(roleId)) return undefined; //NOSONAR

		const cache = this.#cached.has(roleId);
		const role = await this.guild?.roles.fetch(roleId, { cache, force:!cache }).catch(DiscordApiError.process);

		this.#cached.set(roleId, true);

		return role ?? undefined;
	}

	//#endregion

	//#region user

	public async fetchUser(userIdResolvable: Optional<CanBeUserIdResolvable>): Promise<User | undefined> {
		const userId = resolveUserId(userIdResolvable);
		if (!isNonNilSnowflake(userId)) return undefined; //NOSONAR

		const cache = this.#cached.has(userId);
		const user = await this.client.users.fetch(userId, { cache, force:!cache }).catch(DiscordApiError.process);

		this.#cached.set(userId, true);

		return user;
	}

	//#endregion

	//#region webhook

	private webhookMap: Map<string, Webhook | undefined>;

	public async fetchWebhookAndChannel(channelReferenceResolvable: ChannelReferenceResolvable, options?: WebhookOptions): Promise<WebhookAndChannel> {
		const channel = await this.fetchWebhookChannel(channelReferenceResolvable);
		if (!channel) {
			return { };
		}

		const hasPerms = this.hasManageWebhooksPerm(channel);
		if (!hasPerms) {
			return { channel, hasPerms };
		}

		const webhookName = options?.name ?? SageDialogWebhookName;
		const webhookKey = createWebhookKey(channel, webhookName);
		if (!this.webhookMap.has(webhookKey)) {
			const webhooksCollection = await channel.fetchWebhooks().catch(DiscordApiError.process);
			const webhook = webhooksCollection?.find(w => w.name === webhookName);
			this.webhookMap.set(webhookKey, webhook);
		}

		const webhook = this.webhookMap.get(webhookKey);
		return { webhook, channel, hasPerms };
	}

	public async fetchWebhook(channelReferenceResolvable: ChannelReferenceResolvable, options?: WebhookOptions): Promise<Webhook | undefined> {
		const webhookAndChannel = await this.fetchWebhookAndChannel(channelReferenceResolvable, options);
		return webhookAndChannel?.webhook;
	}

	private async fetchWebhookChannelAndThread(channelReferenceResolvable: ChannelReferenceResolvable): Promise<WebhookChannelAndThread | undefined> {
		const { guildId, channelId } = resolveChannelReference(channelReferenceResolvable);
		if (!isNonNilSnowflake(guildId) || !isNonNilSnowflake(channelId)) return undefined; // NOSONAR

		const channelAndThread = await this.fetchChannelAndThread({ guildId, channelId });
		return isSupportedWebhookChannel(channelAndThread.channel) ? channelAndThread as WebhookChannelAndThread : undefined;
	}

	private async fetchWebhookChannel(channelReferenceResolvable: ChannelReferenceResolvable): Promise<SupportedWebhookChannel | undefined> {
		const channelAndThread = await this.fetchWebhookChannelAndThread(channelReferenceResolvable);
		return channelAndThread?.channel;
	}

	//#endregion

	/**
	 * Reusable code to check and log when we don't have permissions.
	 * Logging is done here, once, because this is sometimes called twice in fetchOrCreateWebhook.
	 */
	private hasManageWebhooksPerm(channel: Optional<SupportedWebhookChannel>): channel is SupportedWebhookChannel {
		if (!channel) return false; // NOSONAR

		const key = `${channel.id}-canManageWebhooks`;

		if (!this.#cached.has(key)) {
			const canManageWebhooks = getPermsFor(channel, DiscordCache.getSageId()).can("ManageWebhooks");
			this.#cached.set(key, canManageWebhooks);
		}
		return this.#cached.get(key) === true;
	}

	public async fetchOrCreateWebhook(channelReferenceResolvable: ChannelReferenceResolvable, options?: WebhookOptions): Promise<Webhook | undefined> {
		const { webhook:existing, channel, hasPerms } = await this.fetchWebhookAndChannel(channelReferenceResolvable, options);
		if (existing) return existing; // NOSONAR

		if (!channel || !hasPerms) return undefined; // NOSONAR

		const webhookName = options?.name ?? SageDialogWebhookName;
		const webhookArgs = { ...options, name:webhookName };
		const webhook = await channel.createWebhook(webhookArgs).catch(DiscordApiError.process);
		const key = createWebhookKey(channel, webhookName);
		this.webhookMap.set(key, webhook ?? undefined);
		return webhook;
	}

	// public async findLastWebhookMessageByAuthor(channelReferenceResolvable: ChannelReferenceResolvable, webhookOptions: WebhookOptions, filter: (authorName: string, index: number, messages: Message[]) => Promise<unknown>): Promise<Message | undefined> {
	// 	const webhook = await this.fetchWebhook(channelReferenceResolvable, webhookOptions);
	// 	if (!webhook) return undefined; // NOSONAR

	// 	const channelAndThread = await this.fetchWebhookChannelAndThread(channelReferenceResolvable);
	// 	if (!channelAndThread?.channel) return undefined; // NOSONAR

	// 	const { channel, thread } = channelAndThread;

	// 	const options = {
	// 		before: thread?.lastMessageId ?? channel.lastMessageId ?? undefined,
	// 		limit: 25,
	// 		cache: true
	// 	};

	// 	// if we have a thread, we want to search it for the message
	// 	let messages = thread?.messages;
	// 	// GuildForm doesn't have messages, so we can't look there
	// 	if ("messages" in channel) {
	// 		messages ??= channel.messages;
	// 	}

	// 	const collection = await messages?.fetch(options).catch(DiscordApiError.process);
	// 	if (!collection) return undefined; // NOSONAR

	// 	const webhookId = webhook.id;
	// 	const array = Array.from(collection.values());
	// 	for (let index = 0, length = array.length; index < length; index++) {
	// 		const message = array[index];
	// 		if (message.webhookId === webhookId) {
	// 			const authorName = message.author?.username;
	// 			if (await filter(authorName, index, array)) {
	// 				return message;
	// 			}
	// 		}
	// 	}

	// 	return undefined;
	// }

	// public static async filterChannelMessages(channel: SupportedMessagesChannel, filter: (message: Message, index: number, messages: Message[]) => Promise<unknown>, lastMessageId?: Snowflake, limit?: number): Promise<Message[]> {
	// 	if (!channel) return []; // NOSONAR

	// 	const before = lastMessageId ?? channel.lastMessageId ?? undefined;
	// 	const cache = true;
	// 	if (!limit) limit = 25; // NOSONAR
	// 	const options = { before, cache, limit };

	// 	const collection = await channel.messages.fetch(options).catch(DiscordApiError.process);
	// 	if (!collection) return []; // NOSONAR

	// 	const array = Array.from(collection.values());
	// 	if (!filter) return array; // NOSONAR

	// 	const filtered: Message[] = [];
	// 	for (let i = 0, message = array[i]; i < array.length; i++, message = array[i]) {
	// 		if (await filter(message, i, array).catch(errorReturnFalse)) {
	// 			filtered.push(message);
	// 		}
	// 	}
	// 	return filtered;
	// }

	public static from(guildResolvable: ClientGuildResolvable): DiscordCache;
	public static from(client: Client, guildIdResolvable: GuildIdResolvable): Promise<DiscordCache>;
	public static from(...args: (Client | ClientGuildResolvable | GuildIdResolvable)[]): Awaitable<DiscordCache> {
		// handle client/guildIdResolvable
		if (args.length === 2) {
			const client = args[0] as Client;
			const guildId = resolveGuildId(args[1] as GuildIdResolvable);
			const discordCache = new DiscordCache(client);
			return discordCache.fetchGuild(guildId).then(guild => {
				discordCache.guild = guild;
				return discordCache;
			});
		}

		// handle channel, interaction, message, etc
		const guildResolvable = args[0] as ClientGuildResolvable;
		if ("guild" in guildResolvable) {
			return new DiscordCache(guildResolvable.client, guildResolvable.guild);
		}

		// handle guild
		return new DiscordCache(guildResolvable.client, guildResolvable);
	}

	private static SAGE_ID: Snowflake = NIL_SNOWFLAKE;
	public static getSageId() { return DiscordCache.SAGE_ID; }
	public static setSageId(id: Snowflake) { DiscordCache.SAGE_ID = id; }
}
