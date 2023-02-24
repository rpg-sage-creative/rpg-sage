import type * as Discord from "discord.js";
import type { VALID_UUID } from "../../../sage-utils";
import { EnumUtils } from "../../../sage-utils/utils";
import { StringMatcher } from "../../../sage-utils/utils/StringUtils";
import { isValid } from "../../../sage-utils/utils/UuidUtils";
import type { DInteraction } from "../../discord";
import type { ISageCommandArgs } from "./SageCommand";

export default class SageInteractionArgs implements ISageCommandArgs {

	public constructor(private interaction: DInteraction) { }

	/** Gets the named option as a boolean or null */
	public getBoolean(name: string): boolean | null;
	/** Gets the named option as a boolean */
	public getBoolean(name: string, required: true): boolean;
	public getBoolean(name: string, required = false): boolean | null {
		return this.interaction.isCommand() ? this.interaction.options.getBoolean(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasBoolean(name: string): boolean {
		return this.getBoolean(name) !== null;
	}

	/** Gets the named option as a GuildBasedChannel or null */
	public getChannel(name: string): Discord.GuildBasedChannel | null;
	/** Gets the named option as a GuildBasedChannel */
	public getChannel(name: string, required: true): Discord.GuildBasedChannel;
	public getChannel(name: string): Discord.GuildBasedChannel | null {
		return this.interaction.isCommand() ? this.interaction.options.getChannel(name) as Discord.GuildBasedChannel : null;
	}
	/** Returns true if the argument was given a value. */
	public hasChannel(name: string): boolean {
		return this.getChannel(name) !== null;
	}

	/** Gets the named option as a GuildBasedChannel or null */
	public getChannelDid(name: string): Discord.Snowflake | null;
	/** Gets the named option as a GuildBasedChannel */
	public getChannelDid(name: string, required: true): Discord.Snowflake;
	public getChannelDid(name: string): Discord.Snowflake | null {
		return this.getChannel(name)?.id ?? null;
	}
	/** Returns true if the argument was given a value. */
	public hasChannelDid(name: string): boolean {
		return this.getChannelDid(name) !== null;
	}

	/** Gets the named option as a value from the given enum type or null if not valid */
	public getEnum<U>(type: any, name: string): U | null;
	/** Gets the named option as a string */
	public getEnum<U>(type: any, name: string, required: true): U;
	public getEnum<U>(type: any, name: string): U | null {
		const str = this.getString(name);
		if (str !== null) {
			const value = EnumUtils.parse<U>(type, str);
			if (value !== undefined) {
				return value;
			}
		}
		return null;
	}
	/** Returns true if the argument was given a value. */
	public hasEnum(type: any, name: string): boolean {
		return this.getEnum(type, name) !== null;
	}

	/** Gets the named option as a number or null */
	public getNumber(name: string): number | null;
	/** Gets the named option as a number */
	public getNumber(name: string, required: true): number;
	public getNumber(name: string, required = false): number | null {
		return this.interaction.isCommand() ? this.interaction.options.getNumber(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasNumber(name: string): boolean {
		return this.getNumber(name) !== null;
	}

	/** Gets the named option as a string or null */
	public getString<U extends string = string>(name: string): U | null;
	/** Gets the named option as a string */
	public getString<U extends string = string>(name: string, required: true): U;
	public getString(name: string, required = false): string | null {
		return this.interaction.isCommand() ? this.interaction.options.getString(name, required) : null;
	}
	/** Returns true if the argument was given a value. */
	public hasString(name: string): boolean {
		return this.getString(name) !== null;
	}
	/** Returns true if the argument was given a value that matches the passed value. */
	public hasStringMatch(name: string, value: string): boolean {
		const str = this.getString(name);
		return str !== null && StringMatcher.matches(str, value);
	}
	/** Returns true if the argument was given the passed value. */
	public hasStringValue(name: string, value: string): boolean {
		return this.getString(name) === value;
	}

	/** Returns true if the argument was given the value "unset". */
	public hasUnset(name: string): boolean {
		return this.getString(name)?.trim().toLowerCase() === "unset";
	}

	/** Gets the named option as a VALID_UUID or null */
	public getUuid(name: string): VALID_UUID | null;
	/** Gets the named option as a VALID_UUID */
	public getUuid(name: string, required: true): VALID_UUID;
	public getUuid(name: string, required = false): VALID_UUID | null {
		if (this.interaction.isCommand()) {
			const value = this.interaction.options.getString(name, required);
			if (isValid(value)) {
				return value;
			}
		}
		return null;
	}
	/** Returns true if the argument was given a VALID_UUID value. */
	public hasUuid(name: string): boolean {
		return this.getUuid(name) !== null;
	}
}