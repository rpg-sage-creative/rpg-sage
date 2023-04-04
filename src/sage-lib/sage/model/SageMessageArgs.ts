import type { GuildBasedChannel, Role, Snowflake } from "discord.js";
import type { Args, Optional } from "../../../sage-utils";
import { ArgsManager } from "../../../sage-utils/ArgsUtils";
import { exists } from "../../../sage-utils/ArrayUtils";
import { DiscordId } from "../../../sage-utils/DiscordUtils";
import { VALID_UUID, isValid as isValidUuid } from "../../../sage-utils/UuidUtils";
import { cleanEnumArgValues, ISageCommandArgs } from "./SageCommandArgs";
import type { SageMessage } from "./SageMessage";
import { EnumLike, parse } from "../../../sage-utils/EnumUtils";

type TGameCharacterArgs = {
	embedColor: string;
	images: { tags:string[]; url:string; }[];
	name: string;
}

export type TNames = {
	charName?: string;
	oldName?: string;
	name?: string;
	newName?: string;
	count?: number;
};

export class SageMessageArgs<T extends string = string> extends ArgsManager<T> implements ISageCommandArgs {
	public constructor(protected sageMessage: SageMessage, argsManager: ArgsManager<T>) {
		super();
		if (argsManager?.length) {
			this.push(...argsManager);
		}
	}

	//#region ISageCommandArgs

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		return this.findByKey(name) !== undefined;
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		return this.findByKey(name, /^\s*unset\s*$/i) !== undefined;
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public getBoolean(name: string): Optional<boolean>;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string): Optional<boolean> {
		const value = this.getString(name)?.trim();
		if (value) {
			if (value.match(/^(t|y|1|true|yes)$/i)) {
				return true;
			}
			if (value.match(/^(f|n|0|false|no)$/i)) {
				return false;
			}
			return null;
		}
		return value as null | undefined;
	}

	/** Returns true if getBoolean(name) is not null and not undefined. */
	public hasBoolean(name: string): boolean {
		return exists(this.getBoolean(name));
	}

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getChannel(name: string): Optional<GuildBasedChannel>;
	/** Gets the named option as a GuildBasedChannel */
	public getChannel(name: string, required: true): GuildBasedChannel;
	public getChannel(name: string): Optional<GuildBasedChannel> {
		const channelDid = this.getChannelDid(name);
		if (channelDid) {
			const channel = this.sageMessage.message.mentions.channels.find(channel => channel.id === channelDid);
			return channel as GuildBasedChannel ?? null;
		}
		return channelDid as null | undefined;
	}

	/** Returns true if getChannel(name) is not null and not undefined. */
	public hasChannel(name: string): boolean {
		return exists(this.getChannel(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getChannelDid(name: string): Optional<Snowflake>;
	/** Gets the named option as a Snowflake */
	public getChannelDid(name: string, required: true): Snowflake;
	public getChannelDid(name: string): Optional<Snowflake> {
		const value = this.getString(name);
		if (value) {
			if (DiscordId.isValidId(value) || DiscordId.isChannelReference(value)) {
				return DiscordId.parseId(value);
			}
			return null;
		}
		return value;
	}

	/** Returns true if getChannelDid(name) is not null and not undefined. */
	public hasChannelDid(name: string): boolean {
		return exists(this.getChannelDid(name));
	}

	/**
	 * Gets the named option as a value from the given enum type.
	 * Returns undefined if not found.
	 * Returns null if not a valid enum value or "unset".
	 */
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): Optional<V>;
	/** Gets the named option as a value from the given enum type. */
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string, required: true): V;
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): Optional<V> {
		let value = this.getString(name);
		if (value) {
			/** @todo figure out why i am casting as any */
			return parse(type, cleanEnumArgValues(type as any, value) as K) ?? null;
		}
		return value as null | undefined;
	}

	/** Returns true if getEnum(type, name) is not null and not undefined. */
	public hasEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): boolean {
		return exists(this.getEnum(type, name));
	}

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	public getNumber(name: string): Optional<number>;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string): Optional<number> {
		const stringValue = this.getString(name);
		if (stringValue) {
			const value = +stringValue;
			return isNaN(value) ? null : value;
		}
		return stringValue as null | undefined;
	}

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return exists(this.getNumber(name));
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getRole(name: string): Optional<Role>;
	/** Gets the named option as a GuildBasedChannel */
	public getRole(name: string, required: true): Role;
	public getRole(name: string): Optional<Role> {
		const roleDid = this.getRoleDid(name);
		if (roleDid) {
			const role = this.sageMessage.message.mentions.roles.find(role => role.id === roleDid);
			return role as Role ?? null;
		}
		return roleDid as null | undefined;
	}

	/** Returns true if getRole(name) is not null and not undefined. */
	public hasRole(name: string): boolean {
		return exists(this.getRole(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getRoleDid(name: string): Optional<Snowflake>;
	/** Gets the named option as a Snowflake */
	public getRoleDid(name: string, required: true): Snowflake;
	public getRoleDid(name: string): Optional<Snowflake> {
		const value = this.getString(name);
		if (value) {
			if (DiscordId.isValidId(value) || DiscordId.isRoleMention(value)) {
				return DiscordId.parseId(value);
			}
			return null;
		}
		return value;
	}

	/** Returns true if getRoleDid(name) is not null and not undefined. */
	public hasRoleDid(name: string): boolean {
		return exists(this.getRoleDid(name));
	}

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getString<U extends string = string>(name: string): Optional<U>;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string): Optional<string> {
		return this.hasUnset(name) ? null : this.valueByKey(name);
	}

	/** Returns true if getString(name) is not null and not undefined. */
	public hasString(name: string): boolean;
	/** Returns true if the argument was given the value passed. */
	public hasString(name: string, value: string): boolean;
	/** Returns true if the argument matches the given regex. */
	public hasString(name: string, regex: RegExp): boolean;
	public hasString(name: string, value?: string | RegExp): boolean {
		const argValue = this.getString(name);
		if (!argValue) return false;
		if (value) {
			if (typeof(value) === "string") return argValue === value;
			return value.test(argValue);
		}
		return true;
	}

	/**
	 * Gets the named option as a VALID_UUID.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getUuid(name: string): Optional<VALID_UUID>;
	/** Gets the named option as a VALID_UUID. */
	public getUuid(name: string, required: true): VALID_UUID;
	public getUuid(name: string): Optional<VALID_UUID> {
		const value = this.getString(name);
		if (value) {
			return isValidUuid(value) ? value : null;
		}
		return value as null | undefined;
	}

	/** Returns true if getUuid(name) is not null and not undefined. */
	public hasUuid(name: string): boolean {
		return exists(this.getUuid(name));
	}

	//#endregion

	/** Returns all the channel/thread DID values passed as referenced args. */
	public channelDids(): Snowflake[];
	/**
	 * Returns all the channel/thread DID values passed as referenced args.
	 * If none are found, the current thread or channel DID will be returned in an array.
	 */
	public channelDids(addCurrentIfEmpty: true): Snowflake[];
	public channelDids(addCurrentIfEmpty?: true): Snowflake[] {
		const channelDids = this.sageMessage.message.mentions.channels.map(channel => channel.id);
		if (!channelDids.length && addCurrentIfEmpty && this.sageMessage.discordKey.hasChannel) {
			channelDids.push(this.sageMessage.discordKey.channel);
		}
		return channelDids;
	}

	/** Finds the arguments used to create / update a GameCharacter */
	public findCharacterArgs(): Args<TGameCharacterArgs> {
		const images = ["avatar", "dialog", "token"].map(tag => {
			const url = this.findUrl(tag);
			return url ? { tags:[tag], url } : null;
		}).filter(exists) as { tags:("avatar"|"dialog"|"token")[]; url:string; }[];

		const charArgs: Args<TGameCharacterArgs> = {
			embedColor: this.findDiscordColor("color"),
			images,
			name: this.getString("newName") ?? this.getString("name")
		};

		// If image urls aren't given as key/value pairs, let's take a look and see if they attached any images to the command
		let noAvatar = images.find(img => img.tags.includes("avatar")) === undefined;
		let noDialog = images.find(img => img.tags.includes("dialog")) === undefined;
		let noToken = images.find(img => img.tags.includes("token")) === undefined;
		if (noAvatar || noDialog || noToken) {
			const atts = this.sageMessage.message.attachments.filter(att => !!att.contentType?.includes("image"));
			const avatarUrl = atts.find(att => att.name.match(/avatar/i) || att.url.match(/avatar/i))?.url;
			const dialogUrl = atts.find(att => att.url !== avatarUrl && (att.name.match(/dialog/i) || att.url.match(/dialog/i)))?.url;
			const tokenUrl = atts.find(att => ![avatarUrl, dialogUrl].includes(att.url) && (att.name.match(/token/i) || att.url.match(/token/i)))?.url;
			const otherUrls = atts.filter(att => ![avatarUrl, dialogUrl, tokenUrl].includes(att.url)).map(att => att.url);
			if (noAvatar && (avatarUrl ?? otherUrls.length)) {
				images.push({ tags:["avatar"], url:avatarUrl ?? otherUrls.shift()! });
			}
			if (noDialog && (dialogUrl ?? otherUrls.length)) {
				images.push({ tags:["dialog"], url:dialogUrl ?? otherUrls.shift()! });
			}
			if (noToken && (tokenUrl ?? otherUrls.length)) {
				images.push({ tags:["token"], url:tokenUrl ?? otherUrls.shift()! });
			}
		}

		// If we are still missing images, let's see if they blinding pasted the urls in as unkeyed args.
		noAvatar = images.find(img => img.tags.includes("avatar")) === undefined;
		noDialog = images.find(img => img.tags.includes("dialog")) === undefined;
		noToken = images.find(img => img.tags.includes("token")) === undefined;
		if (noAvatar || noDialog || noToken) {
			const urls = this.unkeyedUrls();
			const avatarUrl = urls.find(url => url.match(/avatar/i));
			const dialogUrl = urls.find(url => url !== avatarUrl && url.match(/dialog/i));
			const tokenUrl = urls.find(url => ![avatarUrl, dialogUrl].includes(url) && url.match(/token/i));
			const otherUrls = urls.filter(url => ![avatarUrl, dialogUrl, tokenUrl].includes(url));
			if (noAvatar && (avatarUrl ?? otherUrls.length)) {
				images.push({ tags:["avatar"], url:avatarUrl ?? otherUrls.shift()! });
			}
			if (noDialog && (dialogUrl ?? otherUrls.length)) {
				images.push({ tags:["dialog"], url:dialogUrl ?? otherUrls.shift()! });
			}
			if (noToken && (tokenUrl ?? otherUrls.length)) {
				images.push({ tags:["token"], url:tokenUrl ?? otherUrls.shift()! });
			}
		}

		return charArgs;
	}

	//#region findDiscordColor

	/**
	 * Finds the first unkeyed Color object and returns .toDiscordColor().
	 * Returns undefined if none found.
	 */
	public findDiscordColor(): Optional<string>;
	/**
	 * Finds the Color object for the given key and returns .toDiscordColor().
	 * Returns null if the value isn't a valid Color.
	 * Returns undefined if the key is not found.
	 */
	public findDiscordColor(key: string): Optional<string>;
	/**
	 * Finds the Color object for the given key and returns .toDiscordColor().
	 * Returns null if the value isn't a valid Color.
	 * If the key is not found, the first unkeyed Color object will be returned.
	 */
	public findDiscordColor(key: string, unkeyed: true): Optional<string>;
	public findDiscordColor(key?: string, unkeyed?: true): Optional<string> {
		const color = this.findColor(key!, unkeyed!);
		return color ? color.toDiscordColor() : color;
	}

	//#endregion

	public findNames(): TNames {
		const names = <TNames>{
			charName: this.getString("charName"),
			oldName: this.getString("oldName"),
			name: this.getString("name"),
			newName: this.getString("newName"),
			count: 0
		};
		names.count = (names.charName ? 1 : 0) + (names.oldName ? 1 : 0) + (names.name ? 1 : 0) + (names.newName ? 1 : 0);
		return names;
	}

	/**
	 * Finds the first unkeyed DID that corresponds to a valid Role.
	 * Returns undefined if none found.
	 */
	public findRoleDid(): Optional<Snowflake>;
	/**
	 * Finds the DID for the given key if it corresponds to a valid Role.
	 * Returns null if it isn't a valid Role.
	 * Returns undefined if the key is not found.
	 */
	public findRoleDid(key: string): Optional<Snowflake>;
	/**
	 * Finds the DID for the given key if it corresponds to a valid Role.
	 * Returns null if it isn't a valid Role.
	 * If the key is not found, the first unkeyed DID that corresponds to a valid Role will be returned.
	 */
	public findRoleDid(key: string, unkeyed: true): Optional<Snowflake>;
	public findRoleDid(key?: string, unkeyed?: true): Optional<Snowflake> {
		type Tester = (value: string) => value is Snowflake;
		return this.findByKeyOrUnkeyed(key, unkeyed, DiscordId.isRoleMention as Tester, DiscordId.parseId);
	}

	public findUserDid(): Optional<Snowflake>;
	public findUserDid(key: string): Optional<Snowflake>;
	public findUserDid(key: string, unkeyed: true): Optional<Snowflake>;
	public findUserDid(key?: string, unkeyed?: true): Optional<Snowflake> {
		type Tester = (value: string) => value is Snowflake;
		return this.findByKeyOrUnkeyed(key, unkeyed, DiscordId.isUserMention as Tester, DiscordId.parseId);
	}

}
