import { isNilSnowflake, isNonNilSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import type { Channel, Interaction, MessageReference, User } from "discord.js";
import { getDiscordUrlRegex } from "./parse/getDiscordUrlRegex.js";
import type { ChannelReference } from "./resolve/resolveChannelReference.js";
import { resolveSnowflake, type CanBeSnowflakeResolvable, type SnowflakeResolvable } from "./resolve/resolveSnowflake.js";
import type { MessageOrPartial, MessageReferenceOrPartial, ReactionOrPartial } from "./types/index.js";
import { isMessage } from "./types/typeGuards/isMessage.js";
import { toChannelUrl } from "./url/toChannelUrl.js";
import { toMessageUrl } from "./url/toMessageUrl.js";

export class DiscordKey implements MessageReference, ChannelReference {
	//#region ChannelReference/MessageReference
	public get guildId(): Snowflake | undefined {
		return this.hasServer ? this.server : undefined;
	}
	public get channelId(): Snowflake {
		return this.threadOrChannel;
	}
	public get messageId(): Snowflake | undefined {
		return this.hasMessage ? this.message : undefined;
	}
	public get type(): number {
		return 0;
	}
	//#endregion

	//#region MessageReferenceAdjacent
	public get userId(): Snowflake | undefined {
		return this.isDm ? this.channel : undefined;
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
		server: Optional<CanBeSnowflakeResolvable>,
		channel: Optional<CanBeSnowflakeResolvable>,
		/** @deprecated */
		thread?: Optional<CanBeSnowflakeResolvable>,
		message?: Optional<CanBeSnowflakeResolvable>
	) {
		this.server = resolveSnowflake(server, true);
		this.channel = resolveSnowflake(channel, true);
		this.thread = resolveSnowflake(thread, true);
		this.message = resolveSnowflake(message, true);

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
	public get channelAndThread(): { channel:Snowflake|undefined; thread:Snowflake|undefined } {
		return {
			channel: this.hasChannel ? this.channel : undefined,
			thread: this.hasThread ? this.thread : undefined
		};
	}
	/** @deprecated */
	public get user(): Snowflake | undefined {
		return this.isDm ? this.channel : undefined;
	}

	public toString(): string { return this.key; }

	public toChannelUrl(): string {
		return toChannelUrl(this);
	}
	public toMessageUrl(): string | undefined {
		return toMessageUrl(this);
	}
	public toUrl(): string {
		return this.toMessageUrl() ?? this.toChannelUrl();
	}

	public static createKey(...resolvables: Optional<SnowflakeResolvable>[]): string {
		return resolvables.map(resolvable => resolveSnowflake(resolvable, true)).join("-");
	}

	public static from(resolvable: Channel | User | Interaction | MessageOrPartial | ReactionOrPartial | MessageReferenceOrPartial): DiscordKey {
		if ("messageId" in resolvable) {
			return new DiscordKey(resolvable.guildId, resolvable.channelId, undefined, resolvable.messageId);
		}
		if ("message" in resolvable) {
			resolvable = resolvable.message as MessageOrPartial;
		}
		const channel = "channel" in resolvable ? resolvable.channel : resolvable;
		const guildId = channel && "isThread" in channel && !channel.isDMBased() ? channel.guildId : undefined;
		const messageId = isMessage(resolvable) ? resolvable.id : undefined;
		if (channel && "isThread" in channel && channel.isThread()) {
			const threadId = channel.id;
			const channelId = channel.parentId;
			return new DiscordKey(guildId, channelId, threadId, messageId);
		}
		return new DiscordKey(guildId, channel?.id, undefined, messageId);
	}

	public static fromUrl(url: string): DiscordKey | undefined {
		const messageMatch = getDiscordUrlRegex({ type:"message" }).exec(url);
		if (messageMatch?.groups) {
			const { guildId, channelId, messageId } = messageMatch.groups;
			return new DiscordKey(guildId, channelId, channelId, messageId);
		}

		const channelMatch = getDiscordUrlRegex({ type:"channel" }).exec(url);
		if (channelMatch?.groups) {
			const { guildId, channelId } = channelMatch.groups;
			return new DiscordKey(guildId, channelId, channelId);
		}

		return undefined;
	}
}
