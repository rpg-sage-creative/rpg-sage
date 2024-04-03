import type { EnumLike, Optional } from "@rsc-utils/type-utils";
import type { CommandInteraction, GuildBasedChannel, Role, User } from "discord.js";
import { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageInteraction } from "./SageInteraction.js";

export class SageInteractionArgs extends SageCommandArgs<SageInteraction> {

	private get interaction(): CommandInteraction { return this.sageCommand.interaction as CommandInteraction; }

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		if (!this.interaction.isApplicationCommand()) return false;
		return this.interaction.options.get(name.toLowerCase()) !== null;
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		if (!this.hasKey(name)) return false;
		const lower = name.toLowerCase();
		const option = this.interaction.options.data.find(opt => opt.name === lower);
		const value = String(option?.value ?? "");
		return /^\s*unset\s*$/i.test(value);
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
		return this.interaction.options.getBoolean(name.toLowerCase(), required);
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
		return this.interaction.options.getChannel(name.toLowerCase()) as GuildBasedChannel;
	}

	public findEnum<K extends string = string, V extends number = number>(_type: EnumLike<K, V>): Optional<V> {
		return undefined;
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
		return this.interaction.options.getNumber(name.toLowerCase(), required);
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
		return this.interaction.options.getRole(name.toLowerCase()) as Role;
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
		return this.interaction.options.getString(name.toLowerCase(), required);
	}

	/**
	 * Gets the named option as a User.
	 * Returns undefined if not found.
	 * Returns null if not a valid User or "unset".
	 */
	public getUser(name: string): Optional<User>;
	/** Gets the named option as a User */
	public getUser(name: string, required: true): User;
	public getUser(name: string): Optional<User> {
		if (!this.hasKey(name)) return undefined;
		if (this.hasUnset(name)) return null;
		return this.interaction.options.getUser(name.toLowerCase()) as User;
	}

}