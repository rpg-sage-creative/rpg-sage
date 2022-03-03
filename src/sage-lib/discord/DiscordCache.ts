import * as Discord from "discord.js";
import type { Optional, OrNull } from "../../sage-utils";
import utils from "../../sage-utils";
import { NilSnowflake } from ".";
import type SageMessage from "../sage/model/SageMessage";
import DiscordKey from "./DiscordKey";
import type { TChannel, TChannelResolvable, TGuildResolvable } from "./types";

//#region Helpers

function isDiscordApiError(reason: any): boolean {
	return reason?.name === "DiscordAPIError";
}
function isUnknownGuild(reason: any): boolean {
	return reason?.message === "Unknown Guild";
}
function isUnknownMember(reason: any): boolean {
	return reason?.message === "Unknown Member";
}
function warnUnknownElseErrorReturnNull(reason: any): null {
	const logger = isDiscordApiError(reason) && (isUnknownMember(reason) || isUnknownGuild(reason)) ? console.warn : console.error;
	logger(reason);
	return null;
}

function dGet<T>(manager: Discord.CachedManager<Discord.Snowflake, any, T>, did: Discord.Snowflake): OrNull<T> {
	console.log(`dGet(${manager ? manager.constructor?.name ?? Object.prototype.toString.apply(manager) : String(manager)}, ${did})`);
	return manager?.cache.get(did) ?? null;
}

async function dFetchGuild(client: Discord.Client, guildResolvable: TGuildResolvable): Promise<OrNull<Discord.Guild>> {
	if (!guildResolvable) {
		return null;
	}
	const guildDid = guildResolvable instanceof Discord.Guild ? guildResolvable.id : guildResolvable;
	console.log(`dFetchGuild(${guildDid})`);
	return client.guilds.fetch(guildDid).catch(warnUnknownElseErrorReturnNull) ?? null;
}

function createWebhookKey(channel: Discord.TextChannel, name: string): string {
	const guildDid = channel.guild?.id ?? NilSnowflake;
	return `${guildDid}-${channel.id}-${name}`;
}

//#endregion

export default class DiscordCache {
	public constructor(public client: Discord.Client, public guild: OrNull<Discord.Guild> = null) {
		if (guild) {
			this.guildMap.set(guild.id, guild);
		}
	}

	private messageMap = new Map<Discord.Snowflake, OrNull<Discord.Message>>();
	public async fetchMessage(discordKey: DiscordKey): Promise<OrNull<Discord.Message>> {
		if (!this.messageMap.has(discordKey.shortKey)) {
			const channel = await this.fetchChannel(discordKey);
			const message = channel ? await channel.messages.fetch(discordKey.message, { cache:true, force:true }) : null;
			this.messageMap.set(discordKey.shortKey, message);
		}
		return this.messageMap.get(discordKey.shortKey) ?? null;
	}

	private guildMap = new Map<Discord.Snowflake, OrNull<Discord.Guild>>();
	public async fetchGuild(guildResolvable: TGuildResolvable): Promise<OrNull<Discord.Guild>> {
		if (guildResolvable instanceof Discord.Guild) {
			this.guildMap.set(guildResolvable.id, guildResolvable);
			return guildResolvable;
		}
		if (!this.guildMap.has(guildResolvable)) {
			this.guildMap.set(guildResolvable, await dFetchGuild(this.client, guildResolvable));
		}
		return this.guildMap.get(guildResolvable) ?? null;
	}

	private guildPreviewMap = new Map<Discord.Snowflake, OrNull<Discord.GuildPreview>>();
	public async fetchGuildName(guildResolvable: TGuildResolvable, defaultValue?: string): Promise<string> {
		if (guildResolvable instanceof Discord.Guild) {
			const guild = await this.fetchGuild(guildResolvable);
			return guild?.name ?? defaultValue ?? "ERROR_FETCHING_GUILD";
		}

		if (!this.guildPreviewMap.has(guildResolvable)) {
			const guildPreview = await this.client.fetchGuildPreview(guildResolvable).catch(utils.ConsoleUtils.Catchers.warnReturnNull);
			this.guildPreviewMap.set(guildResolvable, guildPreview);
		}
		return this.guildPreviewMap.get(guildResolvable)?.name ?? defaultValue ?? "ERROR_FETCHING_GUILD_PREVIEW";
	}

	private channelMap = new Map<string, TChannel | null>();
	public async fetchChannel<T extends TChannel>(discordKey: DiscordKey): Promise<OrNull<T>>;
	public async fetchChannel<T extends TChannel>(channelDid: Optional<Discord.Snowflake>): Promise<OrNull<T>>;
	public async fetchChannel(didOrKey: DiscordKey | Optional<Discord.Snowflake>): Promise<OrNull<TChannel>> {
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
	private async fetchDmChannel(discordKey: DiscordKey): Promise<OrNull<Discord.DMChannel>> {
		const user = discordKey.isDm ? await this.fetchUser(discordKey.channel) : null;
		return user ? user.dmChannel : null;
	}
	private async fetchTextChannel(discordKey: DiscordKey): Promise<OrNull<Discord.TextChannel>> {
		const guildDid = discordKey.hasServer ? discordKey.server : this.guild?.id;
		const guild = guildDid ? await this.fetchGuild(guildDid) : null;
		return guild ? dGet<Discord.TextChannel>(guild.channels, discordKey.threadOrChannel) : null;
	}
	public async fetchChannelName(channelDid: Discord.Snowflake): Promise<string>;
	public async fetchChannelName(discordKey: DiscordKey): Promise<string>;
	public async fetchChannelName(didOrKey: Discord.Snowflake | DiscordKey): Promise<string> {
		const channel = await this.fetchChannel(didOrKey as DiscordKey);
		if (channel) {
			if (channel.type === "DM") {
				return `dm@${channel.recipient.username}#${channel.recipient.discriminator}`;
			}
			return `${channel.guild.name}#${channel.name}`;
		}
		return "ERROR_FETCHING_GUILD_CHANNEL";
	}

	private guildMemberMap = new Map<Discord.Snowflake, OrNull<Discord.GuildMember>>();
	public async fetchGuildMember(userDid: Discord.Snowflake): Promise<OrNull<Discord.GuildMember>> {
		if (!this.guildMemberMap.has(userDid)) {
			const guildMember = await this.guild?.members.fetch({ user:userDid, cache:true, force:true }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
			this.guildMemberMap.set(userDid, guildMember ?? null);
		}
		return this.guildMemberMap.get(userDid) ?? null;
	}

	private guildMemberRoleMap = new Map<string, OrNull<Discord.Role>>();
	public async fetchGuildMemberRole(userDid: Discord.Snowflake, roleDid: Discord.Snowflake): Promise<OrNull<Discord.Role>> {
		const key = `${userDid}-${roleDid}`;
		if (!this.guildMemberRoleMap.has(key)) {
			const guildMember = await this.fetchGuildMember(userDid);
			const role = guildMember?.roles.cache.get(roleDid);
			this.guildMemberRoleMap.set(key, role ?? null);
		}
		return this.guildMemberRoleMap.get(key) ?? null;
	}

	private roleMap = new Map<Discord.Snowflake, OrNull<Discord.Role>>();
	public async fetchGuildRole(roleDid: Discord.Snowflake): Promise<OrNull<Discord.Role>> {
		if (!this.roleMap.has(roleDid)) {
			const role = await this.guild?.roles.fetch(roleDid, { cache:true, force:true }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
			this.roleMap.set(roleDid, role ?? null);
		}
		return this.roleMap.get(roleDid) ?? null;
	}

	private userMap = new Map<Discord.Snowflake, OrNull<Discord.User>>();
	public async fetchUser(userDid: Discord.Snowflake): Promise<OrNull<Discord.User>> {
		if (!this.userMap.has(userDid) && userDid !== NilSnowflake) {
			const user = await this.client.users.fetch(userDid, { cache:true, force:true }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
			this.userMap.set(userDid, user ?? null);
		}
		return this.userMap.get(userDid) ?? null;
	}

	private webhookMap = new Map<string, OrNull<Discord.Webhook>>();
	public async fetchWebhook(guildResolvable: TGuildResolvable, channelResolvable: TChannelResolvable, name: string): Promise<OrNull<Discord.Webhook>> {
		if (!guildResolvable || !channelResolvable || !name) {
			return null;
		}

		const channel = await this.fetchWebhookChannel(guildResolvable, channelResolvable);
		if (!channel || !channel.isText() || !channel.fetchWebhooks) {
			return null;
		}

		const key = createWebhookKey(channel, name);
		if (!this.webhookMap.has(key)) {
			const webhooksCollection = await channel.fetchWebhooks().catch(utils.ConsoleUtils.Catchers.errorReturnNull),
				webhook = webhooksCollection?.find(w => w.name === name);
			this.webhookMap.set(key, webhook ?? null);
		}
		return this.webhookMap.get(key) ?? null;
	}
	private async fetchWebhookChannel(guildResolvable: TGuildResolvable, channelResolvable: TChannelResolvable): Promise<OrNull<Discord.TextChannel>> {
		const discordKey = new DiscordKey(guildResolvable, channelResolvable);
		const guildOrThreadChannel = await this.fetchChannel(discordKey);
		const parentChannel = guildOrThreadChannel?.isThread() ? guildOrThreadChannel.parent : null;
		const channel = parentChannel ?? guildOrThreadChannel;
		return channel as Discord.TextChannel;
	}
	public async fetchOrCreateWebhook(guildResolvable: TGuildResolvable, channelResolvable: TChannelResolvable, name: string, avatar?: string): Promise<OrNull<Discord.Webhook>> {
		if (!guildResolvable || !channelResolvable || !name) {
			return null;
		}

		const existing = await this.fetchWebhook(guildResolvable, channelResolvable, name);
		if (existing) {
			return existing;
		}

		const channel = await this.fetchWebhookChannel(guildResolvable, channelResolvable);
		if (channel && !channel.isThread()) {
			const created = await channel.createWebhook(name, { avatar:avatar }).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
			const key = createWebhookKey(channel, name);
			this.webhookMap.set(key, created ?? null);
			return created;
		}

		return null;
	}

	public async findLastWebhookMessageByAuthor(guildResolvable: TGuildResolvable, channelResolvable: TChannelResolvable, name: string, filter: (authorName: string, index: number, messages: Discord.Message[]) => Promise<unknown>): Promise<OrNull<Discord.Message>> {
		const webhook = await this.fetchWebhook(guildResolvable, channelResolvable, name);
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
			collection = await channel.messages.fetch(options, cacheOptions).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
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

	public static async filterChannelMessages(channel: TChannel, filter: (message: Discord.Message, index: number, messages: Discord.Message[]) => Promise<unknown>, lastMessageId?: Discord.Snowflake, limit?: number): Promise<Discord.Message[]> {
		if (!channel) {
			return [];
		}
		const options = {
			before: <string>lastMessageId ?? channel.lastMessageId,
			limit: limit || 25
		};
		const cacheOptions = { cache:true, force:true };
		const collection = await channel.messages.fetch(options, cacheOptions).catch(utils.ConsoleUtils.Catchers.errorReturnNull);
		if (!collection) {
			return [];
		}
		const array = Array.from(collection.values());
		if (!filter) {
			return array;
		}
		return utils.ArrayUtils.Async.filter(array, filter);
	}

	public static fromSageMessage(sageMessage: SageMessage): DiscordCache {
		return new DiscordCache(sageMessage.message.client, sageMessage.message.guild);
	}
	public static async fromGuildSnowflake(client: Discord.Client, did: Discord.Snowflake): Promise<DiscordCache> {
		return new DiscordCache(client, await dFetchGuild(client, did));
	}
	public static fromGuild(guild: Discord.Guild): DiscordCache {
		return new DiscordCache(guild.client, guild);
	}

	public static fromGuildMember(guildMember: Discord.GuildMember): DiscordCache {
		return new DiscordCache(guildMember.client, guildMember.guild);
	}
	public static fromMessage(message: Discord.Message | Discord.PartialMessage): DiscordCache {
		return new DiscordCache(message.client, message.guild);
	}
	public static fromMessageReaction(messageReaction: Discord.MessageReaction): DiscordCache {
		return DiscordCache.fromMessage(messageReaction.message);
	}
	public static fromInteraction(interaction: Discord.Interaction): DiscordCache {
		return new DiscordCache(interaction.client, interaction.guild);
	}

}
