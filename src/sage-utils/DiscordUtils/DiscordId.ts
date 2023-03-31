import { channelMention, roleMention, Snowflake, userMention } from "discord.js";
import type { Optional, OrUndefined } from "..";
import { isDefined } from "..";
import { isSnowflake, NIL_SNOWFLAKE } from "../SnowflakeUtils";
import { createCustomEmojiRegex } from "./emoji";

export enum SnowflakeType { ChannelReference, CustomEmoji, RoleMention, UserMention, Snowflake }

type THasSnowflakeId = { id:Snowflake; };
type THasSnowflakeDid = { did:Snowflake; };
type TSnowflakeResolvable = Snowflake | THasSnowflakeId | THasSnowflakeDid;

export class DiscordId {
	protected constructor(
		public type: SnowflakeType,
		public did: Snowflake,
		public name?: string,
		public animated?: boolean
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
		if (DiscordId.isChannelReference(value)) {
			return new DiscordId(SnowflakeType.ChannelReference, DiscordId.parseId(value));
		}
		if (DiscordId.isCustomEmoji(value)) {
			const [_, animated, name, did] = value.match(createCustomEmojiRegex()) ?? [];
			return new DiscordId(SnowflakeType.CustomEmoji, did, name, animated === "a");
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

	public static parseId(value: string): Snowflake | NIL_SNOWFLAKE {
		return (value?.match(/\d{16,}/) ?? [])[0] ?? NIL_SNOWFLAKE;
	}

	public static isChannelReference(value: string): boolean {
		return isDefined(value?.match(/^<#\d{16,}>$/));
	}
	public static isCustomEmoji(value: string): boolean {
		return isDefined(value?.match(createCustomEmojiRegex()));
	}
	public static isRoleMention(value: string): boolean {
		return isDefined(value?.match(/^<@&\d{16,}>$/));
	}
	public static isValidId(value: Optional<Snowflake>): boolean {
		return isSnowflake(value);
	}
	public static isUserMention(value: string): boolean {
		return isDefined(value?.match(/^<@\!?\d{16,}>$/));
	}

	public static isMentionOrReference(value: string): boolean {
		return DiscordId.isChannelReference(value)
			|| DiscordId.isRoleMention(value)
			|| DiscordId.isUserMention(value);
	}

	public static toChannelReference(did: Optional<Snowflake>): string | null {
		return did ? channelMention(did) : null;
	}
	public static toCustomEmoji(name: Optional<string>, did: Optional<Snowflake>): string | null {
		// TODO: should I create my own formatter? --> return did ? Discord.Formatters.formatEmoji(did) : null;
		return name && did ? `<:${name}:${did}>` : null;
	}
	public static toRoleMention(did: Optional<Snowflake>): string | null {
		return did ? roleMention(did) : null;
	}
	public static toUserMention(did: Optional<Snowflake>): string | null {
		return did ? userMention(did) : null;
	}

	public static resolve(resolvable: TSnowflakeResolvable): Snowflake;
	public static resolve(resolvable: Optional<TSnowflakeResolvable>): OrUndefined<Snowflake>;
	public static resolve(resolvable: Optional<TSnowflakeResolvable>): OrUndefined<Snowflake> {
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
