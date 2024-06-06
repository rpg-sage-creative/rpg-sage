import { getSageId, getWebhookName, type SageWebhookType } from "@rsc-sage/env";
import { filterAsync } from "@rsc-utils/array-utils";
import { debug, error, info, warn } from "@rsc-utils/core-utils";
import { DTextChannel, DThreadChannel, DiscordKey, toHumanReadable, type DChannelResolvable, type DGuildResolvable, type DMessageChannel } from "@rsc-utils/discord-utils";
import { NIL_SNOWFLAKE, isNonNilSnowflake, orNilSnowflake } from "@rsc-utils/core-utils";
import type { Optional } from "@rsc-utils/core-utils";
import { CachedManager, Client, DMChannel, Guild, GuildMember, GuildPreview, Interaction, Message, MessageReaction, PartialMessage, Role, Snowflake, TextChannel, User, Webhook } from "discord.js";
import type { SageMessage } from "../sage/model/SageMessage.js";
import { getPermsFor } from "./permissions/getPermsFor.js";

//#region Helpers

function isDiscordApiErrorMissingPermissionsFetchWebhook(reason: any): boolean {
	const stringValue = Object.prototype.toString.call(reason);
	return stringValue.includes("DiscordAPIError: Missing Permissions")
		&& stringValue.includes("TextChannel.fetchWebhooks");
}
type TDiscordApiError = {
	name: "DiscordAPIError";
	message: string;
	path: string;
	/** https://discord.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes */
	code: number;
	method: "GET"|"POST"|"PATCH"|"PUT"|"DELETE"
};
function isDiscordApiError(reason: any): reason is TDiscordApiError {
	return reason?.name === "DiscordAPIError";
}
function isUnknownGuild(reason: TDiscordApiError): boolean {
	return reason?.message === "Unknown Guild";
}
function isUnknownMember(reason: TDiscordApiError): boolean {
	return reason?.message === "Unknown Member";
}
function isUnknownUser(reason: TDiscordApiError): boolean {
	return reason?.message === "Unknown User";
}
function warnUnknownElseErrorReturnNull(reason: any): null {
	if (isDiscordApiErrorMissingPermissionsFetchWebhook(reason)) {
		warn(`DiscordAPIError: Missing Permissions (TextChannel.fetchWebhooks)`);
	}else {
		if (isDiscordApiError(reason) && (isUnknownMember(reason) || isUnknownGuild(reason) || isUnknownUser(reason))) {
			warn(`${reason.message}: ${reason.path}`);
		}else {
			error(reason);
		}
	}
	return null;
}

function dGet<T>(manager: CachedManager<Snowflake, any, T>, did: Snowflake): T | null {
	debug(`dGet(${manager ? manager.constructor?.name ?? Object.prototype.toString.apply(manager) : String(manager)}, ${did})`);
	return manager?.cache.get(did) ?? null;
}

async function dFetchGuild(client: Client, guildResolvable: DGuildResolvable): Promise<Guild | null> {
	if (!guildResolvable) {
		return null;
	}
	const guildId = typeof(guildResolvable) === "string" ? guildResolvable : guildResolvable.id;
	debug(`dFetchGuild(${guildId})`);
	return client.guilds.fetch(guildId).catch(warnUnknownElseErrorReturnNull) ?? null;
}

function createWebhookKey(channel: TextChannel, name: string): string {
	const guildDid = orNilSnowflake(channel.guild?.id);
	return `${guildDid}-${channel.id}-${name}`;
}

//#endregion

export class DiscordCache {
	public constructor(public client: Client, public guild: Guild | null = null, channel: DMessageChannel | null = null) {
		this.channelMap = new Map();
		this.guildMap = new Map();
		this.guildPreviewMap = new Map();
		this.guildMemberMap = new Map([[NIL_SNOWFLAKE, null]]);
		this.guildMemberRoleMap = new Map();
		this.messageMap = new Map();
		this.roleMap = new Map();
		this.userMap = new Map();
		this.webhookMap = new Map();
		this.manageWebhooksPermMap = new Map();

		if (channel) {
			this.channelMap.set(channel.id, channel);
		}
		if (guild) {
			this.guildMap.set(guild.id, guild);
		}
	}

	/** Clears the cache/maps in an attempt to avoid memory leaks. */
	public clear(): void {
		debug("Clearing DiscordCache");
		this.channelMap.clear();
		this.guildMap.clear();
		this.guildPreviewMap.clear();
		this.guildMemberMap.clear();
		this.guildMemberRoleMap.clear();
		this.messageMap.clear();
		this.roleMap.clear();
		this.userMap.clear();
		this.webhookMap.clear();
		this.manageWebhooksPermMap.clear();
	}

	//#region channel

	private channelMap: Map<string, DMessageChannel | null>;

	public async fetchChannel<T extends DMessageChannel>(discordKey: DiscordKey): Promise<T | null>;
	public async fetchChannel<T extends DMessageChannel>(channelDid: Optional<Snowflake>): Promise<T | null>;
	public async fetchChannel(didOrKey: DiscordKey | Optional<Snowflake>): Promise<DMessageChannel | null> {
		if (!didOrKey) {
			return null;
		}
		const discordKey = didOrKey instanceof DiscordKey ? didOrKey : new DiscordKey(this.guild?.id, didOrKey);
		if (!this.channelMap.has(discordKey.shortKey)) {
			const channel = discordKey.isDm
				? await this.fetchDmChannel(discordKey)
				: await this.fetchTextChannel(discordKey);
			this.channelMap.set(discordKey.shortKey, channel);
		}
		return this.channelMap.get(discordKey.shortKey) ?? null;
	}

	public async fetchChannelAndThread(discordKey: DiscordKey): Promise<{ channel?:DTextChannel|null; thread?:DThreadChannel|null; }> {
		const threadOrChannel = await this.fetchChannel(discordKey.threadOrChannel);
		if (threadOrChannel?.isThread()) {
			const channel = await this.fetchChannel<DTextChannel>(threadOrChannel.parentId);
			return { channel, thread:threadOrChannel };
		}
		if (threadOrChannel?.isText()) {
			return { channel:threadOrChannel as DTextChannel };
		}
		return { };
	}

	private async fetchDmChannel(discordKey: DiscordKey): Promise<DMChannel | null> {
		const user = discordKey.isDm ? await this.fetchUser(discordKey.user!) : null;
		return user ? user.dmChannel : null;
	}

	private async fetchTextChannel(discordKey: DiscordKey): Promise<TextChannel | null> {
		const guildDid = discordKey.hasServer ? discordKey.server : this.guild?.id;
		const guild = guildDid ? await this.fetchGuild(guildDid) : null;
		return guild ? dGet<TextChannel>(guild.channels, discordKey.threadOrChannel) : null;
	}

	//#endregion

	//#region guild

	private guildMap: Map<Snowflake, Guild | null>;

	public async fetchGuild(guildResolvable: DGuildResolvable): Promise<Guild | null> {
		if (guildResolvable instanceof Guild) {
			this.guildMap.set(guildResolvable.id, guildResolvable);
			return guildResolvable;
		}
		if (guildResolvable instanceof GuildPreview) {
			const guild = await dFetchGuild(this.client, guildResolvable);
			this.guildMap.set(guildResolvable.id, guild);
			return guild;
		}
		if (!this.guildMap.has(guildResolvable)) {
			this.guildMap.set(guildResolvable, await dFetchGuild(this.client, guildResolvable));
		}
		return this.guildMap.get(guildResolvable) ?? null;
	}

	//#endregion

	//#region guild preview

	private guildPreviewMap: Map<Snowflake, GuildPreview | null>;

	public async fetchGuildName(guildResolvable: DGuildResolvable, defaultValue?: string): Promise<string> {
		if (guildResolvable instanceof Guild || guildResolvable instanceof GuildPreview) {
			const guild = await this.fetchGuild(guildResolvable);
			return guild?.name ?? defaultValue ?? "ERROR_FETCHING_GUILD";
		}

		if (!this.guildPreviewMap.has(guildResolvable)) {
			const guildPreview = await this.client.fetchGuildPreview(guildResolvable).catch(warnUnknownElseErrorReturnNull);
			this.guildPreviewMap.set(guildResolvable, guildPreview);
		}
		return this.guildPreviewMap.get(guildResolvable)?.name ?? defaultValue ?? "ERROR_FETCHING_GUILD_PREVIEW";
	}

	//#endregion

	//#region guild member

	private guildMemberMap: Map<Snowflake, GuildMember | null>;

	public async fetchGuildMember(userDid: Snowflake): Promise<GuildMember | null> {
		if (!this.guildMemberMap.has(userDid)) {
			const guildMember = await this.guild?.members.fetch({ user:userDid, cache:true, force:true }).catch(warnUnknownElseErrorReturnNull);
			this.guildMemberMap.set(userDid, guildMember ?? null);
		}
		return this.guildMemberMap.get(userDid) ?? null;
	}

	//#endregion

	//#region guild member role

	private guildMemberRoleMap: Map<string, Role | null>;

	public async fetchGuildMemberRole(userDid: Snowflake, roleDid: Snowflake): Promise<Role | null> {
		const key = `${userDid}-${roleDid}`;
		if (!this.guildMemberRoleMap.has(key)) {
			const guildMember = await this.fetchGuildMember(userDid);
			const role = guildMember?.roles.cache.get(roleDid);
			this.guildMemberRoleMap.set(key, role ?? null);
		}
		return this.guildMemberRoleMap.get(key) ?? null;
	}

	//#endregion

	//#region message

	private messageMap: Map<Snowflake, Message | null>;

	public async fetchMessage(discordKey: DiscordKey): Promise<Message | null> {
		if (!this.messageMap.has(discordKey.shortKey)) {
			const channel = await this.fetchChannel(discordKey);
			const message = channel ? await channel.messages.fetch(discordKey.message, { cache:true, force:true }) : null;
			this.messageMap.set(discordKey.shortKey, message);
		}
		return this.messageMap.get(discordKey.shortKey) ?? null;
	}

	//#endregion

	//#region role

	private roleMap: Map<Snowflake, Role | null>;

	public async fetchGuildRole(roleDid: Snowflake): Promise<Role | null> {
		if (!this.roleMap.has(roleDid)) {
			const role = await this.guild?.roles.fetch(roleDid, { cache:true, force:true }).catch(warnUnknownElseErrorReturnNull);
			this.roleMap.set(roleDid, role ?? null);
		}
		return this.roleMap.get(roleDid) ?? null;
	}

	//#endregion

	//#region user

	private userMap: Map<Snowflake, User | null>;

	public async fetchUser(userDid: Snowflake): Promise<User | null> {
		if (!this.userMap.has(userDid) && isNonNilSnowflake(userDid)) {
			const user = await this.client.users.fetch(userDid, { cache:true, force:true }).catch(warnUnknownElseErrorReturnNull);
			this.userMap.set(userDid, user ?? null);
		}
		return this.userMap.get(userDid) ?? null;
	}

	//#endregion

	//#region webhook

	private webhookMap: Map<string, Webhook | null>;

	public async fetchWebhook(guildResolvable: DGuildResolvable, channelResolvable: DChannelResolvable, type: SageWebhookType): Promise<Webhook | null> {
		if (!guildResolvable || !channelResolvable) {
			return null;
		}

		const channel = await this.fetchWebhookChannel(guildResolvable, channelResolvable);
		if (!this.hasManageWebhooksPerm(channel)) {
			return null;
		}

		const webhookName = getWebhookName(type);
		if (!webhookName) {
			return null;
		}

		const key = createWebhookKey(channel, webhookName);
		if (!this.webhookMap.has(key)) {
			const webhooksCollection = await channel.fetchWebhooks().catch(warnUnknownElseErrorReturnNull),
				webhook = webhooksCollection?.find(w => w.name === webhookName);
			this.webhookMap.set(key, webhook ?? null);
		}
		return this.webhookMap.get(key) ?? null;
	}

	private async fetchWebhookChannel(guildResolvable: DGuildResolvable, channelResolvable: DChannelResolvable): Promise<TextChannel | null> {
		const discordKey = new DiscordKey(guildResolvable, channelResolvable);
		const guildOrThreadChannel = await this.fetchChannel(discordKey);
		const parentChannel = guildOrThreadChannel?.isThread() ? guildOrThreadChannel.parent : null;
		const channel = parentChannel ?? guildOrThreadChannel;
		return channel as TextChannel;
	}

	//#endregion

	private manageWebhooksPermMap: Map<Snowflake, Optional<boolean>>;
	/**
	 * Reusable code to check and log when we don't have permissions.
	 * Logging is done here, once, because this is sometimes called twice in fetchOrCreateWebhook.
	 */
	private hasManageWebhooksPerm(channel: Optional<TextChannel>): channel is TextChannel {
		if (!channel?.createWebhook || !channel?.fetchWebhooks) {
			return false;
		}

		const did = channel.id;
		if (!this.manageWebhooksPermMap.has(did)) {
			const { canManageWebhooks } = getPermsFor(channel, getSageId());
			if (!canManageWebhooks) {
				info(`No Permission (MANAGE_WEBHOOKS): ${toHumanReadable(channel)}`);
			}
			this.manageWebhooksPermMap.set(did, canManageWebhooks);
		}
		return this.manageWebhooksPermMap.get(did) === true;
	}

	public async fetchOrCreateWebhook(guildResolvable: DGuildResolvable, channelResolvable: DChannelResolvable, type: SageWebhookType, avatar?: string): Promise<Webhook | null> {
		if (!guildResolvable || !channelResolvable) {
			return null;
		}

		const existing = await this.fetchWebhook(guildResolvable, channelResolvable, type);
		if (existing) {
			return existing;
		}

		const channel = await this.fetchWebhookChannel(guildResolvable, channelResolvable);
		if (!this.hasManageWebhooksPerm(channel)) {
			return null;
		}

		if (!channel.isThread()) {
			const webhookName = getWebhookName(type);
			const created = await channel.createWebhook(webhookName, { avatar:avatar }).catch(warnUnknownElseErrorReturnNull);
			const key = createWebhookKey(channel, webhookName);
			this.webhookMap.set(key, created ?? null);
			return created;
		}

		return null;
	}

	public async findLastWebhookMessageByAuthor(guildResolvable: DGuildResolvable, channelResolvable: DChannelResolvable, type: SageWebhookType, filter: (authorName: string, index: number, messages: Message[]) => Promise<unknown>): Promise<Message | null> {
		const webhook = await this.fetchWebhook(guildResolvable, channelResolvable, type);
		if (!webhook) {
			return null;
		}

		const discordKey = new DiscordKey(webhook.guildId, channelResolvable);
		const channel = await this.fetchChannel(discordKey);
		if (!channel || !channel.lastMessageId) {
			return null;
		}
		const options = { before: channel.lastMessageId, limit: 25 },
			cacheOptions = { cache:true, force:true },
			collection = await channel.messages.fetch(options, cacheOptions).catch(warnUnknownElseErrorReturnNull);
		if (!collection) {
			return null;
		}

		const webhookId = webhook.id,
			array = Array.from(collection.values());
		for (let index = 0, length = array.length; index < length; index++) {
			const message = array[index];
			if (message.webhookId === webhookId) {
				const authorName = message.author?.username;
				if (await filter(authorName, index, array)) {
					return message;
				}
			}
		}

		return null;
	}

	public static async filterChannelMessages(channel: DMessageChannel, filter: (message: Message, index: number, messages: Message[]) => Promise<unknown>, lastMessageId?: Snowflake, limit?: number): Promise<Message[]> {
		if (!channel) {
			return [];
		}
		const options = {
			before: <string>lastMessageId ?? channel.lastMessageId,
			limit: limit || 25
		};
		const cacheOptions = { cache:true, force:true };
		const collection = await channel.messages.fetch(options, cacheOptions).catch(warnUnknownElseErrorReturnNull);
		if (!collection) {
			return [];
		}
		const array = Array.from(collection.values());
		if (!filter) {
			return array;
		}
		return filterAsync(array, filter);
	}

	public static fromSageMessage(sageMessage: SageMessage): DiscordCache {
		return new DiscordCache(sageMessage.message.client, sageMessage.message.guild);
	}
	public static async fromGuildSnowflake(client: Client, did: Snowflake): Promise<DiscordCache> {
		return new DiscordCache(client, await dFetchGuild(client, did));
	}
	public static fromGuild(guild: Guild): DiscordCache {
		return new DiscordCache(guild.client, guild);
	}

	public static fromGuildMember(guildMember: GuildMember): DiscordCache {
		return new DiscordCache(guildMember.client, guildMember.guild);
	}
	public static fromMessage(message: Message | PartialMessage): DiscordCache {
		return new DiscordCache(message.client, message.guild);
	}
	public static fromMessageReaction(messageReaction: MessageReaction): DiscordCache {
		return DiscordCache.fromMessage(messageReaction.message);
	}
	public static fromInteraction(interaction: Interaction): DiscordCache {
		return new DiscordCache(interaction.client, interaction.guild);
	}

}
