import type { ChatInputCommandInteraction, GuildBasedChannel, Role, Snowflake } from "discord.js";
import { isDefined, type Optional,  } from "../../../sage-utils";
import type { DInteraction } from "../../../sage-utils/DiscordUtils";
import { ValidUuid, isUuid } from "../../../sage-utils/UuidUtils";
import type { ISageCommandArgs } from "./SageCommandArgs";
import { EnumLike, parse } from "../../../sage-utils/EnumUtils";

export class SageInteractionArgs implements ISageCommandArgs {
	public constructor(private _interaction: DInteraction) { }

	private get interaction(): ChatInputCommandInteraction { return this._interaction as ChatInputCommandInteraction; }

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		if (!this.interaction.isChatInputCommand()) return false;
		return this.interaction.options.get(name) !== null;
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		if (!this.hasKey(name)) return false;
		const value = this.interaction.options.getString(name) ?? "";
		return value.match(/^\s*unset\s*$/i) !== null;
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public getBoolean(name: string): Optional<boolean>;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string, required = false): Optional<boolean> {
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getBoolean(name, required);
	}

	/** Returns true if getBoolean(name) is not null and not undefined. */
	public hasBoolean(name: string): boolean {
		return isDefined(this.getBoolean(name));
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
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getChannel(name) as GuildBasedChannel;
	}

	/** Returns true if getChannel(name) is not null and not undefined. */
	public hasChannel(name: string): boolean {
		return isDefined(this.getChannel(name));
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
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.getChannel(name)?.id ?? null;
	}

	/** Returns true if getChannelDid(name) is not null and not undefined. */
	public hasChannelDid(name: string): boolean {
		return isDefined(this.getChannelDid(name));
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
		const value = this.getString(name);
		if (value) {
			return parse(type, value) ?? null;
		}
		return value as null | undefined;
	}

	/** Returns true if getEnum(type, name) is not null and not undefined. */
	public hasEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): boolean {
		return isDefined(this.getEnum(type, name));
	}

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	public getNumber(name: string): Optional<number>;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string, required = false): Optional<number> {
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getNumber(name, required);
	}

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return isDefined(this.getNumber(name));
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
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getRole(name) as Role;
	}

	/** Returns true if getRole(name) is not null and not undefined. */
	public hasRole(name: string): boolean {
		return isDefined(this.getRole(name));
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
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.getRole(name)?.id ?? null;
	}

	/** Returns true if getRoleDid(name) is not null and not undefined. */
	public hasRoleDid(name: string): boolean {
		return isDefined(this.getRoleDid(name));
	}

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getString<U extends string = string>(name: string): Optional<U>;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string, required = false): Optional<string> {
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getString(name, required);
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
	public getUuid(name: string): Optional<ValidUuid>;
	/** Gets the named option as a VALID_UUID. */
	public getUuid(name: string, required: true): ValidUuid;
	public getUuid(name: string): Optional<ValidUuid> {
		const value = this.getString(name);
		if (value) {
			return isUuid(value) ? value : null;
		}
		return value as null | undefined;
	}

	/** Returns true if getUuid(name) is not null and not undefined. */
	public hasUuid(name: string): boolean {
		return isDefined(this.getUuid(name));
	}

}