import { NIL_SNOWFLAKE, isNonNilSnowflake, orNilSnowflake, type Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { GuildChannel, MessageReaction } from "discord.js";
import type { DInteraction, DMessage, TChannel } from "./types";

interface IHasSnowflakeId { id:Snowflake; }
type TSnowflakeResolvable = string | IHasSnowflakeId;

export class DiscordKey {

	public server: Snowflake;
	public channel: Snowflake;
	public thread: Snowflake;
	public message: Snowflake;

	public isDm: boolean;
	public isEmpty: boolean;
	public isValid: boolean;
	public key: string;
	public shortKey: string;

	public hasServer: boolean;
	public hasChannel: boolean;
	public hasThread: boolean;
	public hasMessage: boolean;

	public constructor(
		server: Optional<TSnowflakeResolvable>,
		channel: Optional<TSnowflakeResolvable>,
		thread?: Optional<TSnowflakeResolvable>,
		message?: Optional<TSnowflakeResolvable>
	) {
		this.server = DiscordKey.resolveDid(server);
		this.channel = DiscordKey.resolveDid(channel);
		this.thread = DiscordKey.resolveDid(thread);
		this.message = DiscordKey.resolveDid(message);

		this.isDm = this.server === NIL_SNOWFLAKE;
		this.key = DiscordKey.createKey(server, channel, thread, message);
		this.shortKey = DiscordKey.createKey(server, message ?? thread ?? channel);

		this.hasServer = isNonNilSnowflake(this.server);
		this.hasChannel = isNonNilSnowflake(this.channel);
		this.hasThread = isNonNilSnowflake(this.thread);
		this.hasMessage = isNonNilSnowflake(this.message);
		this.isEmpty = !this.hasServer && !this.hasChannel && !this.hasThread && !this.hasMessage;
		this.isValid = (this.isDm && this.hasChannel) || (this.hasServer && (this.hasChannel || this.hasThread || this.hasMessage));
	}

	public get threadOrChannel(): Snowflake {
		return this.hasThread ? this.thread : this.channel;
	}

	public toString(): string { return this.key; }

	public static createKey(...resolvables: Optional<TSnowflakeResolvable>[]): string {
		return resolvables
			.map(resolvable => DiscordKey.resolveDid(resolvable))
			.join("-");
	}

	public static fromChannel(channel: TChannel): DiscordKey {
		const guildId = (channel as GuildChannel).guild?.id;
		if (channel.isThread()) {
			const threadDid = channel.id;
			const channelDid = channel.parent?.id;
			return new DiscordKey(guildId, channelDid, threadDid);
		}
		return new DiscordKey(guildId, channel.id);
	}

	public static fromInteraction(interaction: DInteraction): DiscordKey {
		const channel = interaction.channel;
		if (channel?.isThread()) {
			const threadDid = channel.id;
			const channelDid = channel.parent?.id;
			return new DiscordKey(interaction.guildId, channelDid, threadDid);
		}
		return new DiscordKey(interaction.guildId, interaction.channelId);
	}

	public static fromMessage(message: DMessage): DiscordKey {
		const channel = message.channel;
		const guildId = (channel as GuildChannel).guild?.id;
		if (channel.isThread()) {
			const threadDid = channel.id;
			const channelDid = channel.parent?.id;
			return new DiscordKey(guildId, channelDid, threadDid, message.id);
		}
		return new DiscordKey(guildId, message.channel.id, null, message.id);
	}

	public static fromMessageReaction(messageReaction: MessageReaction): DiscordKey {
		return DiscordKey.fromMessage(messageReaction.message);
	}

	/** Resolves to a nonNilSnowflake or NIL_SNOWFLAKE. */
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Snowflake | NIL_SNOWFLAKE {
		return orNilSnowflake(typeof(resolvable) === "string" ? resolvable : resolvable?.id);
	}
}
