import * as Discord from "discord.js";
import type { Optional, OrUndefined } from "../../sage-utils";
import { isDefined } from "../../sage-utils";
import { NilSnowflake } from "./consts";
import { SnowflakeType } from "./enums";
import { existsAndUnique } from "../../sage-utils/utils/ArrayUtils/Filters";
import { DMessage } from "./types";

type THasSnowflakeId = { id:Discord.Snowflake; };
type THasSnowflakeDid = { did:Discord.Snowflake; };
type TSnowflakeResolvable = Discord.Snowflake | THasSnowflakeId | THasSnowflakeDid;

function createUrlRegex(global?: "g"): RegExp {
	// https://discord.com/channels/480488957889609733/680954802003378218
	// https://discord.com/channels/480488957889609733/680954802003378218/1148099095555215422
	// serverId = 480488957889609733
	// channelId = 680954802003378218
	// messageId = 1148099095555215422

	// https://discord.com/channels/@me/471161996411142149/1148033705789632592
	// userId = 193773494079717378
	// channelId = 471161996411142149
	// messageId = 1148033705789632592

	if (global === "g")
	return  /https:\/\/discord\.com\/channels\/(@me|\d{16,})\/(\d{16,})(?:\/(\d{16,}))?/g;
	return /^https:\/\/discord\.com\/channels\/(@me|\d{16,})\/(\d{16,})(?:\/(\d{16,}))?$/;
}
function contentToUrls(content: Optional<string>): string[] {
	return content?.match(createUrlRegex("g")) ?? [];
}
type TDiscordKey = { server:Discord.Snowflake; channel:Discord.Snowflake; message:Discord.Snowflake; };
function urlToKey(url: Optional<string>): TDiscordKey | null {
	return urlsToKeys([url])[0] ?? null;
}
function isNilSnowflake(value: Optional<Discord.Snowflake>): boolean {
	return value?.match(/^0{16,}$/) !== null;
}
function orNilSnowflake(value: Optional<Discord.Snowflake>): Discord.Snowflake {
	return value?.match(/^\d{16,}$/) && !isNilSnowflake(value) ? value : NilSnowflake;
}
function urlsToKeys(urls: Optional<string>[]): TDiscordKey[] {
	const regex = createUrlRegex();
	return urls.map(url => {
		const match = url?.match(regex);
		if (match) {
			const [_url, server, channel, message] = match;
			return { server:orNilSnowflake(server), channel:orNilSnowflake(channel), message:orNilSnowflake(message) };
		}
		return null;
	}).filter(key => key !== null) as TDiscordKey[];
}

export default class DiscordId {
	protected constructor(
		public type: SnowflakeType,
		public did: Discord.Snowflake,
		public name?: string
	) { }

	public toString(): string | null {
		switch(this.type) {
			case SnowflakeType.ChannelReference:
				return DiscordId.toChannelReference(this.did);
			case SnowflakeType.CustomEmoji:
				return DiscordId.toCustomEmoji(this.name, this.did);
			case SnowflakeType.RoleMention:
				return DiscordId.toRoleMention(this.did);
			case SnowflakeType.UserMention:
				return DiscordId.toUserMention(this.did);
			case SnowflakeType.Snowflake:
				return this.did;
			default:
				return null;
		}
	}

	public static from(value: string): DiscordId | null {
		if (DiscordId.isChannelLink(value)) {
			return new DiscordId(SnowflakeType.ChannelReference, urlToKey(value)?.channel!);
		}
		if (DiscordId.isChannelReference(value)) {
			return new DiscordId(SnowflakeType.ChannelReference, DiscordId.parseId(value));
		}
		if (DiscordId.isCustomEmoji(value)) {
			const [_, name, did] = value.match(/<:(\w+):(\d+)>/) ?? [];
			return new DiscordId(SnowflakeType.CustomEmoji, did, name);
		}
		if (DiscordId.isRoleMention(value)) {
			return new DiscordId(SnowflakeType.RoleMention, DiscordId.parseId(value));
		}
		if (DiscordId.isUserMention(value)) {
			return new DiscordId(SnowflakeType.UserMention, DiscordId.parseId(value));
		}
		if (DiscordId.isValidId(value)) {
			return new DiscordId(SnowflakeType.Snowflake, value);
		}
		return null;
	}

	public static parseMentions(message: DMessage): { channelIds: Discord.Snowflake[]; } {
		const channelMentions = message.mentions.channels;
		const channelUrls = urlsToKeys(contentToUrls(message.content));
		const channelReferences = message.content?.match(/<#\d{16,}>/g) ?? [];
		const channelIds = channelMentions.map(channel => channel.id)
							.concat(channelUrls.map(url => url.channel))
							.concat(channelReferences.map(DiscordId.parseId))
							.filter(existsAndUnique)
							.filter(id => !isNilSnowflake(id))
							;
		return {
			channelIds
		};
	}

	public static parseId(value: string): Discord.Snowflake {
		return (value?.match(/\d{16,}/) ?? [])[0] ?? NilSnowflake;
	}

	public static isChannelLink(value: string): boolean {
		return !isNilSnowflake(urlToKey(value)?.channel);
	}

	public static isChannelReference(value: string): boolean {
		return isDefined(value?.match(/^<#\d{16,}>$/));
	}

	public static isCustomEmoji(value: string): boolean {
		return isDefined(value?.match(/^<:\w{2,}:\d{16,}>$/));
	}

	public static isRoleMention(value: string): boolean {
		return isDefined(value?.match(/^<@&\d{16,}>$/));
	}
	public static isValidId(value: Optional<Discord.Snowflake>): boolean {
		return isDefined(value?.match(/^\d{16,}$/));
	}
	public static isUserMention(value: string): boolean {
		return isDefined(value?.match(/^<@\!?\d{16,}>$/));
	}

	public static toChannelReference(did: Optional<Discord.Snowflake>): string | null {
		return did ? Discord.Formatters.channelMention(did) : null;
	}
	public static toCustomEmoji(name: Optional<string>, did: Optional<Discord.Snowflake>): string | null {
		// TODO: should I create my own formatter? --> return did ? Discord.Formatters.formatEmoji(did) : null;
		return name && did ? `<:${name}:${did}>` : null;
	}
	public static toRoleMention(did: Optional<Discord.Snowflake>): string | null {
		return did ? Discord.Formatters.roleMention(did) : null;
	}
	public static toUserMention(did: Optional<Discord.Snowflake>): string | null {
		return did ? Discord.Formatters.userMention(did) : null;
	}

	public static resolve(resolvable: TSnowflakeResolvable): Discord.Snowflake;
	public static resolve(resolvable: Optional<TSnowflakeResolvable>): OrUndefined<Discord.Snowflake>;
	public static resolve(resolvable: Optional<TSnowflakeResolvable>): OrUndefined<Discord.Snowflake> {
		if (resolvable) {
			if (typeof(resolvable) === "string") {
				return resolvable;
			}
			if ("did" in resolvable) {
				return resolvable.did;
			}
			if ("id" in resolvable) {
				return resolvable.id;
			}
		}
		return undefined;
	}
}
