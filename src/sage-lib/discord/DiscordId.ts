import * as Discord from "discord.js";
import type { Optional, OrUndefined } from "../../sage-utils";
import { isDefined } from "../../sage-utils";
import { SnowflakeType } from "./enums";

type THasSnowflakeId = { id:Discord.Snowflake; };
type THasSnowflakeDid = { did:Discord.Snowflake; };
type TSnowflakeResolvable = Discord.Snowflake | THasSnowflakeId | THasSnowflakeDid;

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
		if (DiscordId.isChannelReference(value)) {
			return new DiscordId(SnowflakeType.ChannelReference, DiscordId.parseId(value));
		}
		if (DiscordId.isCustomEmoji(value)) {
			return new DiscordId(SnowflakeType.CustomEmoji, DiscordId.parseId(value), value.slice(2, -20));
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

	public static parseId(value: string): Discord.Snowflake {
		return value && value.slice(-19, -1);
	}

	public static isChannelReference(value: string): boolean {
		return isDefined(value?.match(/^<#\d{18}>$/));
	}
	public static isCustomEmoji(value: string): boolean {
		return isDefined(value?.match(/^<:\w{2,}:\d{18}>$/));
	}
	public static isRoleMention(value: string): boolean {
		return isDefined(value?.match(/^<@&\d{18}>$/));
	}
	public static isValidId(value: Optional<Discord.Snowflake>): boolean {
		return isDefined(value?.match(/^\d{18}$/));
	}
	public static isUserMention(value: string): boolean {
		return isDefined(value?.match(/^<@\!?\d{18}>$/));
	}

	public static isMentionOrReference(value: string): boolean {
		return DiscordId.isChannelReference(value)
			|| DiscordId.isRoleMention(value)
			|| DiscordId.isUserMention(value);
	}

	public static toChannelReference(did: Optional<Discord.Snowflake>): string | null {
		return did ? Discord.Formatters.channelMention(did) : null;
	}
	public static toCustomEmoji(name: Optional<string>, did: Optional<Discord.Snowflake>): string | null {
		// TODO: should I create my own formatter? --> return did ? Discord.Formatters.formatEmoji(did) : null;
		return name && did ? `<#:${name}:${did}>` : null;
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
