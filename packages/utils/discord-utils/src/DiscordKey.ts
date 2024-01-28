import { isNilSnowflake, isNonNilSnowflake, orNilSnowflake, type NIL_SNOWFLAKE, type Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { MessageReference } from "discord.js";
import { createDiscordUrlRegex } from "./parse/createDiscordUrlRegex.js";
import type { DGuildChannel, DInteraction, DMessage, DMessageChannel, DReaction } from "./types.js";
import { toChannelUrl } from "./url/toChannelUrl.js";
import { toMessageUrl } from "./url/toMessageUrl.js";

interface IHasSnowflakeId { id:Snowflake; }
type TSnowflakeResolvable = string | IHasSnowflakeId;

export class DiscordKey implements MessageReference {
	//#region MessageReference
	public get guildId(): Snowflake | undefined {
		return this.hasServer ? this.server : undefined;
	}
	public get channelId(): Snowflake {
		return this.threadOrChannel;
	}
	public get messageId(): Snowflake | undefined {
		return this.hasMessage ? this.message : undefined;
	}
	//#endregion

	public server: Snowflake;
	public channel: Snowflake;
	/** @deprecated */
	public thread: Snowflake;
	public message: Snowflake;

	public isDm: boolean;
	public isEmpty: boolean;
	public isValid: boolean;
	public key: string;
	public shortKey: string;

	public hasServer: boolean;
	public hasChannel: boolean;
	/** @deprecated */
	public hasThread: boolean;
	public hasMessage: boolean;

	public constructor(
		server: Optional<TSnowflakeResolvable>,
		channel: Optional<TSnowflakeResolvable>,
		/** @deprecated */
		thread?: Optional<TSnowflakeResolvable>,
		message?: Optional<TSnowflakeResolvable>
	) {
		this.server = DiscordKey.resolveId(server);
		this.channel = DiscordKey.resolveId(channel);
		this.thread = DiscordKey.resolveId(thread);
		this.message = DiscordKey.resolveId(message);

		this.isDm = isNilSnowflake(this.server);

		this.hasServer = isNonNilSnowflake(this.server);
		this.hasChannel = isNonNilSnowflake(this.channel);
		this.hasThread = isNonNilSnowflake(this.thread);
		this.hasMessage = isNonNilSnowflake(this.message);
		this.isEmpty = !this.hasServer && !this.hasChannel && !this.hasThread && !this.hasMessage;
		this.isValid = (this.isDm && this.hasChannel) || (this.hasServer && (this.hasChannel || this.hasThread || this.hasMessage));

		this.key = DiscordKey.createKey(this.server, this.channel, this.thread, this.message);
		if (this.hasMessage) {
			this.shortKey = DiscordKey.createKey(this.server, this.message);
		}else if (this.hasThread) {
			this.shortKey = DiscordKey.createKey(this.server, this.thread);
		}else {
			this.shortKey = DiscordKey.createKey(this.server, this.channel);
		}
	}

	/** @deprecated Returns the thread if it has one. Returns the channel otherwise. */
	public get threadOrChannel(): Snowflake {
		return this.hasThread ? this.thread : this.channel;
	}
	/** @deprecated */
	public get channelAndThread(): { channel:Snowflake|null; thread:Snowflake|null } {
		return {
			channel: this.hasChannel ? this.channel : null,
			thread: this.hasThread ? this.thread : null
		};
	}
	/** @deprecated */
	public get user(): Snowflake | null {
		return this.isDm ? this.channel : null;
	}

	public toString(): string { return this.key; }

	public toChannelUrl(): string {
		return toChannelUrl(this);
	}
	public toMessageUrl(): string | null {
		return toMessageUrl(this);
	}
	public toUrl(): string {
		return this.toMessageUrl() ?? this.toChannelUrl();
	}

	public static createKey(...resolvables: Optional<TSnowflakeResolvable>[]): string {
		return resolvables.map(DiscordKey.resolveId).join("-");
	}

	public static fromChannel(channel: DMessageChannel): DiscordKey {
		const guildId = (channel as DGuildChannel).guild?.id;
		if (channel.isThread()) {
			const threadId = channel.id;
			const channelId = channel.parent?.id;
			return new DiscordKey(guildId, channelId, threadId);
		}
		return new DiscordKey(guildId, channel.id);
	}

	public static fromInteraction(interaction: DInteraction): DiscordKey {
		const channel = interaction.channel;
		if (channel?.isThread()) {
			const threadId = channel.id;
			const channelId = channel.parent?.id;
			return new DiscordKey(interaction.guildId, channelId, threadId);
		}
		return new DiscordKey(interaction.guildId, interaction.channelId);
	}

	public static fromMessage(message: DMessage): DiscordKey {
		const channel = message.channel;
		const guildId = (channel as DGuildChannel).guild?.id;
		if (channel.isThread()) {
			const threadId = channel.id;
			const channelId = channel.parent?.id;
			return new DiscordKey(guildId, channelId, threadId, message.id);
		}
		return new DiscordKey(guildId, message.channel.id, null, message.id);
	}

	public static fromMessageReaction(messageReaction: DReaction): DiscordKey {
		return DiscordKey.fromMessage(messageReaction.message as DMessage);
	}

	/** Resolves to a nonNilSnowflake or NIL_SNOWFLAKE. */
	public static resolveId(resolvable: Optional<TSnowflakeResolvable>): Snowflake | NIL_SNOWFLAKE {
		return orNilSnowflake(typeof(resolvable) === "string" ? resolvable : resolvable?.id);
	}

	public static fromUrl(url: string): DiscordKey | null {
		const messageMatch = createDiscordUrlRegex("message").exec(url);
		if (messageMatch?.groups) {
			const { guildId, channelId, messageId } = messageMatch.groups;
			return new DiscordKey(guildId, channelId, channelId, messageId);
		}

		const channelMatch = createDiscordUrlRegex("channel").exec(url);
		if (channelMatch?.groups) {
			const { guildId, channelId } = channelMatch.groups;
			return new DiscordKey(guildId, channelId, channelId);
		}

		return null;
	}
}
