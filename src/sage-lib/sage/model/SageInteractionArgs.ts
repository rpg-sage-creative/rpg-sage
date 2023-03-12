import type { CommandInteraction, GuildBasedChannel, Snowflake } from "discord.js";
import type { Optional, VALID_UUID } from "../../../sage-utils";
import { EnumUtils } from "../../../sage-utils/utils";
import { exists } from "../../../sage-utils/utils/ArrayUtils/Filters";
import type { DInteraction } from "../../../sage-utils/utils/DiscordUtils";
import { isValid as isValidUuid } from "../../../sage-utils/utils/UuidUtils";
import type { ISageCommandArgs } from "./SageCommandArgs";

export default class SageInteractionArgs implements ISageCommandArgs {
	public constructor(private _interaction: DInteraction) { }

	private get interaction(): CommandInteraction { return this._interaction as CommandInteraction; }

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		if (!this.interaction.isCommand()) return false;
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
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getChannel(name) as GuildBasedChannel;
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
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.getChannel(name)?.id ?? null;
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
	public getEnum<U>(type: any, name: string): Optional<U>;
	/** Gets the named option as a value from the given enum type. */
	public getEnum<U>(type: any, name: string, required: true): U;
	public getEnum<U>(type: any, name: string): Optional<U> {
		const value = this.getString(name);
		if (value) {
			return EnumUtils.parse<U>(type, value) ?? null;
		}
		return value as null | undefined;
	}

	/** Returns true if getEnum(type, name) is not null and not undefined. */
	public hasEnum(type: any, name: string): boolean {
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
	public getNumber(name: string, required = false): Optional<number> {
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getNumber(name, required);
	}

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return exists(this.getNumber(name));
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

}