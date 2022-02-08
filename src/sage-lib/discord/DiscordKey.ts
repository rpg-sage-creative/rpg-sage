import type * as Discord from "discord.js";
import type { Optional } from "../../sage-utils";
import { NilSnowflake } from "./consts";
import type { DMessage, TChannel } from "./types";

interface IHasSnowflakeId { id:Discord.Snowflake; }
type TSnowflakeResolvable = string | IHasSnowflakeId;

export default class DiscordKey {

	public server: Discord.Snowflake;
	public channel: Discord.Snowflake;
	public thread: Discord.Snowflake;
	public message: Discord.Snowflake;

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
		this.server = DiscordKey.resolveDid(server) ?? NilSnowflake;
		this.channel = DiscordKey.resolveDid(channel) ?? NilSnowflake;
		this.thread = DiscordKey.resolveDid(thread) ?? NilSnowflake;
		this.message = DiscordKey.resolveDid(message) ?? NilSnowflake;

		this.isDm = this.server === NilSnowflake;
		this.key = DiscordKey.createKey(server, channel, thread, message);
		this.shortKey = DiscordKey.createKey(server, message ?? thread ?? channel);

		this.hasServer = this.server !== NilSnowflake;
		this.hasChannel = this.channel !== NilSnowflake;
		this.hasThread = this.thread !== NilSnowflake;
		this.hasMessage = this.message !== NilSnowflake;
		this.isEmpty = !this.hasServer && !this.hasChannel && !this.hasThread && !this.hasMessage;
		this.isValid = (this.isDm && this.hasChannel) || (this.hasServer && (this.hasChannel || this.hasThread || this.hasMessage));
	}

	public get threadOrChannel(): Discord.Snowflake {
		return this.hasThread ? this.thread : this.channel;
	}

	public toString(): string { return this.key; }

	public static createKey(...resolvables: Optional<TSnowflakeResolvable>[]): string {
		return resolvables
			.map(resolvable => DiscordKey.resolveDid(resolvable) ?? NilSnowflake)
			.join("-");
	}

	public static fromChannel(channel: TChannel): DiscordKey {
		const guildId = (channel as Discord.GuildChannel).guild?.id;
		if (channel.isThread()) {
			const threadDid = channel.id;
			const channelDid = channel.parent?.id;
			return new DiscordKey(guildId, channelDid, threadDid);
		}
		return new DiscordKey(guildId, channel.id);
	}

	public static fromMessage(message: DMessage): DiscordKey {
		const channel = message.channel;
		const guildId = (channel as Discord.GuildChannel).guild?.id;
		if (channel.isThread()) {
			const threadDid = channel.id;
			const channelDid = channel.parent?.id;
			return new DiscordKey(guildId, channelDid, threadDid, message.id);
		}
		return new DiscordKey(guildId, message.channel.id, null, message.id);
	}

	public static fromMessageReaction(messageReaction: Discord.MessageReaction): DiscordKey {
		return DiscordKey.fromMessage(messageReaction.message);
	}

	public static resolveDid(resolvable: TSnowflakeResolvable): Discord.Snowflake;
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Discord.Snowflake | undefined;
	public static resolveDid(resolvable: Optional<TSnowflakeResolvable>): Discord.Snowflake | undefined {
		return typeof(resolvable) === "string" ? resolvable : resolvable?.id;
	}
}
