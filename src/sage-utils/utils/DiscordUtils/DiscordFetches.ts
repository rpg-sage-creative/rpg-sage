import { Client, Guild, GuildMember, GuildPreview, Message, Role, Snowflake, User, Webhook } from "discord.js";
import type { If, Optional } from "../..";
import { Collection } from "../ArrayUtils";
import { warnUnknownElseErrorReturnNull } from "./errorHandlers";
import { toHumanReadable } from "./humanReadable";
import { canReactTo, canSendMessageTo } from "./permChecks";
import { isNonNilSnowflake, resolveSnowflake } from "./snowflake";
import { canCheckPermissionsFor, canFetchWebhooksFor } from "./typeChecks";
import type { DChannel, DChannelResolvable, DDMChannel, DGuildChannel, DGuildResolvable, DInteraction, DMessage, DRoleResolvable, DUserResolvable, DWebhookChannel } from "./types";

export type DiscordFetchesArgs = {
	botId?: Optional<Snowflake>;
	channel?: Optional<DGuildChannel>;
	client?: Optional<Client>;
	guild?: Optional<Guild>;
	user?: Optional<User>
	webhookName?: Optional<string>;
};

type FilterOptions = {
	filter?: (message: Message, index: number, messages: Message[]) => Promise<unknown>;
	lastMessageId?: Snowflake;
	limit?: number;
};

	/**
	 * @todo SageChannelResolvable should be or include SnowflakeResolvable? Will need to check if a channel or just a has did/id ...
	 */

export default class DiscordFetches<
		HasGuild extends boolean = boolean,
		HasGuildChannel extends boolean = boolean,
		HasUser extends boolean = boolean
		> {

	//#region properties

	public static botId: Snowflake;
	public get botId(): Snowflake { return this.args.botId ?? DiscordFetches.botId; }

	public get channel(): If<HasGuildChannel, DGuildChannel, null> { return this.args.channel ?? null as any; }

	public static client: Client;
	public get client(): Client { return this.args.client ?? DiscordFetches.client; }

	public get guild(): If<HasGuild, Guild, null> { return this.args.guild ?? null as any; }

	public get user(): If<HasUser, User, null> { return this.args.user ?? null as any; }

	public static webhookName: string;
	public get webhookName(): string { return this.args.webhookName ?? DiscordFetches.webhookName; }

	//#endregion

	//#region constructor / from

	protected constructor(protected args: DiscordFetchesArgs) {
		if (!this.botId) {
			console.error(`Must have botId to use ${this.constructor.name}!`);
		}
		if (!this.client) {
			console.error(`Must have client to use ${this.constructor.name}!`);
		}
		if (!this.webhookName) {
			console.error(`Must have webhookName to use ${this.constructor.name}!`);
		}
	}

	public static from(args: DiscordFetchesArgs): DiscordFetches {
		return new DiscordFetches(args);
	}

	public static fromInteraction(interaction: DInteraction): DiscordFetches {
		return new DiscordFetches({
			client: interaction.client,
			guild: interaction.guild,
			channel: interaction.channel?.type === "DM" ? null : interaction.channel as DGuildChannel,
			user: interaction.user
		});
	}

	public static fromMessage(message: DMessage): DiscordFetches {
		if (message.channel.type === "DM") {
			return new DiscordFetches({
				client: message.client,
				user: message.author
			});
		}else {
			return new DiscordFetches({
				client: message.client,
				guild: message.guild,
				channel: message.channel
			});
		}
	}

	//#endregion

	//#region for

	/** Creates a new DiscordFetches for the given Client. */
	public async forClient(client: Client): Promise<DiscordFetches<false, false, false>> {
		return new DiscordFetches({ botId:this.args.botId, client, webhookName:this.args.webhookName });
	}

	/** Creates a new DiscordFetches for the given dm channel's User. */
	public async forChannel(channel: Optional<DDMChannel>): Promise<DiscordFetches<false, false, true> | null>;
	/** Creates a new DiscordFetches for the given guild channel. */
	public async forChannel(channel: Optional<DGuildChannel>): Promise<DiscordFetches<true, true, false> | null>;
	public async forChannel(channel: Optional<DChannel>): Promise<DiscordFetches | null> {
		if (channel) {
			if (channel.type === "DM") {
				return this.forUser(channel.recipient);
			}
			return new DiscordFetches({ botId:this.args.botId, client:this.args.client, channel, guild:channel.guild, webhookName:this.args.webhookName });
		}
		return null;
	}

	/** Creates a new DiscordFetches for the given Guild. */
	public async forGuild(guildResolvable: Optional<DGuildResolvable>): Promise<DiscordFetches<true, false, false> | null> {
		const guild = await this.fetchGuild(guildResolvable);
		return guild ? new DiscordFetches({ botId:this.args.botId, client:this.args.client, guild, webhookName:this.args.webhookName }) : null;
	}

	/** Creates a new DiscordFetches for the given User. */
	public async forUser(userResolvable: Optional<DUserResolvable>): Promise<DiscordFetches<false, false, true> | null> {
		const user = await this.fetchUser(userResolvable);
		return user ? new DiscordFetches({ botId:this.args.botId, client:this.args.client, user, webhookName:this.args.webhookName }) : null;
	}

	/** Makes sure we can use the channel for webhooks. */
	public async forWebhook(): Promise<DiscordFetches<true, true, false> | null>;
	/** Creates a new fetch object for the given webhook. */
	public async forWebhook(webhookName: Optional<string>): Promise<DiscordFetches<true, true, false> | null>;
	/** Creates a new fetch object for the given channel. */
	public async forWebhook(channel: Optional<DGuildChannel>): Promise<DiscordFetches<true, true, false> | null>;
	/** Creates a new fetch object for the given channel and webhook. */
	public async forWebhook(channel: Optional<DGuildChannel>, webhookName: Optional<string>): Promise<DiscordFetches<true, true, false> | null>;
	public async forWebhook(...args: Optional<DGuildChannel | string>[]): Promise<DiscordFetches | null> {
		const thisChannel = this.channel as DGuildChannel | null ?? null;
		const channel = args.find(arg => typeof(arg) !== "string") as DGuildChannel | null ?? null;
		const isNotThisChannel = channel !== thisChannel && channel?.id !== thisChannel?.id;

		const thisWebhookName = this.args.webhookName as string | null ?? null;
		const webhookName = args.find(arg => typeof(arg) === "string") as string | null ?? null;
		const isNotThisWebhookName = webhookName !== thisWebhookName;


		if ((channel && isNotThisChannel) || (webhookName && isNotThisWebhookName)) {
			const newChannel = channel ?? thisChannel;
			if (canFetchWebhooksFor(newChannel)) {
				const newWebhookName = webhookName ?? thisWebhookName;
				return new DiscordFetches({ botId:this.args.botId, client:this.args.client, channel:newChannel, guild:newChannel.guild, webhookName:newWebhookName });
			}
			return null;
		}

		if (canFetchWebhooksFor(thisChannel)) {
			return this;
		}

		return null;
	}

	//#endregion

	//#region client fetches

	/** Fetches the given guild or null. */
	public async fetchGuild(guildResolvable: Optional<DGuildResolvable>): Promise<Guild | null>;
	/** Fetches the given guild's preview or null. (Used mainly for getting the name.) */
	public async fetchGuild(guildResolvable: Optional<DGuildResolvable>, preview: true): Promise<GuildPreview | null>;
	public async fetchGuild(guildResolvable: Optional<DGuildResolvable>, preview?: true): Promise<Guild | GuildPreview | null> {
		if (guildResolvable) {
			if (!preview && guildResolvable instanceof Guild) return guildResolvable;
			if (preview && guildResolvable instanceof GuildPreview) return guildResolvable;
			const guildId = resolveSnowflake(guildResolvable);
			if (!isNonNilSnowflake(guildId)) {
				if (preview) return this.client.fetchGuildPreview(guildId).catch(warnUnknownElseErrorReturnNull);
				return this.client.guilds.fetch(guildId).catch(warnUnknownElseErrorReturnNull);
			}
		}
		return null;
	}

	/** Fetches the given guild and returns its name. */
	public async fetchGuildName(guildResolvable: DGuildResolvable): Promise<string>;
	/** Fetches the given guild and returns its name, or the value given if the guild isn't found. */
	public async fetchGuildName(guildResolvable: DGuildResolvable, defaultValue: string): Promise<string>;
	public async fetchGuildName(guildResolvable: DGuildResolvable, defaultValue?: string): Promise<string> {
		const guild = await this.fetchGuild(guildResolvable, true);
		return guild?.name ?? defaultValue ?? "UnknownGuild";
	}

	/** Fetches the given user. */
	public async fetchUser(userResolvable: Optional<DUserResolvable>): Promise<User | null> {
		if (userResolvable) {
			if (userResolvable instanceof User) return userResolvable;
			const userId = resolveSnowflake(userResolvable);
			if (isNonNilSnowflake(userId)) {
				return this.client.users.fetch(userId).catch(warnUnknownElseErrorReturnNull);
			}
		}
		return null;
	}

	//#endregion

	//#region guild fetches

	/** Return the current guild or dm channel. */
	public async fetchChannel(): Promise<If<HasGuildChannel, DGuildChannel, If<HasUser, DDMChannel, null>>>;
	/** Fetch the given channel. */
	public async fetchChannel<T extends DGuildChannel>(channelResolvable: Optional<DChannelResolvable>): Promise<T | null>;
	public async fetchChannel<T extends DGuildChannel>(...args: Optional<DChannelResolvable>[]): Promise<DChannel | null> {
		if (!args.length) {
			if (this.user) return this.user.dmChannel;
			if (this.channel) return this.channel;
			return null;
		}

		const channelResolvable = args[0];
		if (channelResolvable) {
			if (typeof(channelResolvable) !== "string") return channelResolvable as T;
			const channelId = resolveSnowflake(channelResolvable);
			if (isNonNilSnowflake(channelId)) {
				const channel = await this.guild?.channels.fetch(channelResolvable).catch(warnUnknownElseErrorReturnNull);;
				return channel ? channel as T : null;
			}
		}
		return null;
	}

	/** Fetches the given user as a GuildMember only if we have a guild. */
	public async fetchGuildMember(userResolvable: Optional<DUserResolvable>): Promise<If<HasGuild, GuildMember | null, null>>
	public async fetchGuildMember(userResolvable: Optional<DUserResolvable>): Promise<GuildMember | null> {
		const guild = this.guild;
		if (guild && userResolvable) {
			const userId = resolveSnowflake(userResolvable);
			if (isNonNilSnowflake(userId)) {
				const guildMember = await guild.members.fetch(userId).catch(warnUnknownElseErrorReturnNull);
				return guildMember ?? null;
			}
		}
		return null;
	}

	/** Fetches the given user as a GuildMember only if we have a guild. */
	public async fetchGuildRole(roleResolvable: Optional<DRoleResolvable>): Promise<If<HasGuild, Role | null, null>>
	public async fetchGuildRole(roleResolvable: Optional<DRoleResolvable>): Promise<Role | null> {
		const guild = this.guild;
		if (guild && roleResolvable) {
			if (roleResolvable instanceof Role) return roleResolvable;
			const roleId = resolveSnowflake(roleResolvable);
			if (isNonNilSnowflake(roleId)) {
				const guildRole = await guild.roles.fetch(roleId).catch(warnUnknownElseErrorReturnNull);
				return guildRole ?? null;
			}
		}
		return null;
	}

	//#endregion

	//#region channel fetches

	/** Return the name of the current guild or dm channel. */
	public async fetchChannelName(): Promise<string>;
	/** Fetch the name of the given channel. */
	public async fetchChannelName(channelResolvable: Optional<DChannelResolvable>): Promise<string>;
	public async fetchChannelName(...args: Optional<DChannelResolvable>[]): Promise<string> {
		if (!args.length) {
			if (this.user) return toHumanReadable(this.user);
			if (this.channel) return toHumanReadable(this.channel) ?? "UnknownGuildChannel";
			return toHumanReadable(this.channel) ?? "NoChannel";
		}

		const channel = await this.fetchChannel(args[0]);
		if (channel) {
			return toHumanReadable(this.channel);
		}
		return "UnknownChannel";
	}

	public async fetchMessage(messageId: Snowflake): Promise<If<HasGuildChannel | HasUser, Message, null>>;
	public async fetchMessage(messageId: Snowflake): Promise<Message | null> {
		if (isNonNilSnowflake(messageId)) {
			const channel = await this.fetchChannel();
			const message = await channel?.messages.fetch(messageId);
			return message ?? null;
		}
		return null;
	}

	public async filterMessages(opts: FilterOptions): Promise<If<HasGuildChannel | HasUser, Message[], null>>;
	public async filterMessages(opts: FilterOptions): Promise<Message[] | null> {
		const channel = await this.fetchChannel();
		if (!channel) return null;

		const before = opts.lastMessageId ?? channel.lastMessageId ?? undefined;
		const limit = opts.limit ?? 25;
		const collection = await channel.messages.fetch({ before, limit }).catch(warnUnknownElseErrorReturnNull);
		if (!collection) {
			return [];
		}

		const array = Array.from(collection.values());
		if (!opts.filter) {
			return array;
		}

		return Collection.filterAsync(array, opts.filter);
	}

	//#endregion

	//#region webhook

	/** Fetches the webhook channel and checks it for perms. */
	private async fetchWebhookChannel(): Promise<DWebhookChannel | null> {
		if (!this.channel) return null;
		const parentChannel = this.channel.isThread() ? this.channel.parent as DGuildChannel : null;
		const channel = parentChannel ?? this.channel;
		if (channel) {
			if (canFetchWebhooksFor(channel)) {
				if (canCheckPermissionsFor(channel)) {
					const hasPerm = channel.permissionsFor(this.botId, true)?.has("MANAGE_WEBHOOKS");
					if (hasPerm) {
						return channel as DWebhookChannel;
					}else {
						console.info(`No Permission (MANAGE_WEBHOOKS): ${toHumanReadable(channel)}`);
					}
				}else {
					console.info(`No permissionsFor: ${toHumanReadable(channel)}`);
				}
			}else {
				console.info(`No fetchWebhooks: ${toHumanReadable(channel)}`);
			}
		}
		return null;
	}

	/** Fetches the Webhook. */
	public async fetchWebhook(): Promise<If<HasGuildChannel, Webhook | null, null>>;
	public async fetchWebhook(): Promise<Webhook | null> {
		const webhookName = this.webhookName;
		const channel = await this.fetchWebhookChannel();
		const webhooksCollection = await channel?.fetchWebhooks().catch(warnUnknownElseErrorReturnNull);
		return webhooksCollection?.find(w => w.name === webhookName) ?? null;
	}

	/** Fetches or creates the Webhook. */
	public async fetchOrCreateWebhook(avatar?: string): Promise<If<HasGuildChannel, Webhook | null, null>>;
	public async fetchOrCreateWebhook(avatar?: string): Promise<Webhook | null> {
		let webhook: Optional<Webhook> = await this.fetchWebhook();
		if (!webhook) {
			const channel = await this.fetchWebhookChannel();
			webhook = await channel?.createWebhook(this.webhookName, { avatar:avatar }).catch(warnUnknownElseErrorReturnNull);
		}
		return webhook ?? null;
	}

	/** Search the last 25 messages in this channel to find the last message posted as a webhook using the given filter. */
	public async findLastWebhookMessageByAuthor(filter: (authorName: string, index: number, messages: Message[]) => Promise<unknown>): Promise<If<HasGuildChannel, Message | null, null>>;
	public async findLastWebhookMessageByAuthor(filter: (authorName: string, index: number, messages: Message[]) => Promise<unknown>): Promise<Message | null> {
		if (!this.channel) return null;

		const webhook = await this.fetchWebhook();
		if (!webhook) {
			return null;
		}

		if (!this.channel.lastMessageId) {
			return null;
		}

		const before = this.channel.lastMessageId ?? undefined;
		const limit = 25;
		const collection = await this.channel.messages.fetch({ before, limit }).catch(warnUnknownElseErrorReturnNull);
		if (!collection) {
			return null;
		}

		const webhookId = webhook.id,
			array = Array.from(collection.values());
		for (let index = 0, length = array.length; index < length; index++) {
			const message = array[index];
			if (message.webhookId === webhookId) {
				const authorName = message.author.username;
				if (await filter(authorName, index, array)) {
					return message;
				}
			}
		}

		return null;
	}

	//#endregion

	//#region can tests

	/** Can we react to the current channel's messages. */
	public canReactTo(): boolean;
	/** Can we react to the given channel's messages. */
	public canReactTo(channel: Optional<DChannel>): boolean;
	/** Can we react to the given message. */
	public canReactTo(message: Optional<DMessage>): boolean;
	public canReactTo(arg?: Optional<DChannel | DMessage>): boolean {
		const argChannel = arg && "channel" in arg ? arg.channel : arg;
		const channel = argChannel ?? this.channel;
		return channel ? canReactTo(this.botId, channel) : false;
	}

	/** Can we send messages to the current channel. */
	public canSendMessageTo(): boolean;
	/** Can we send messages to the given channel. */
	public canSendMessageTo(channel: Optional<DChannel>): boolean;
	public canSendMessageTo(arg?: Optional<DChannel>): boolean {
		const channel = arg ?? this.channel;
		return channel ? canSendMessageTo(this.botId, channel) : false;
	}

	//#endregion

}
