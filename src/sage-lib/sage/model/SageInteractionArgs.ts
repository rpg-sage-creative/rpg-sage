import type { EnumLike, Optional } from "@rsc-utils/core-utils";
import type { MessageChannel } from "@rsc-utils/discord-utils";
import { ApplicationCommandOptionType, Attachment, CommandInteraction, GuildMember, Role, User } from "discord.js";
import { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageInteraction } from "./SageInteraction.js";

type OptionData<T extends boolean | number | string> = {
	name: string;
	nameLower: string;
	hasKey: boolean;
	hasUnset: boolean;
	type?: ApplicationCommandOptionType;
	value?: T | null;
	stringValue?: string | null;
};

export class SageInteractionArgs extends SageCommandArgs<SageInteraction> {

	private get interaction(): CommandInteraction { return this.sageCommand.interaction as CommandInteraction; }

	/**
	 * Looks for the option by name.
	 * If no key is found, then .hasKey is false and .value is undefined.
	 * If the key is found, but the String(value) is /unset/ then .hasUnset is true and .value is null.
	 * Otherwise, the value is returned as found.
	 * This allows for returning .getOption(name).value to properly reflect hasKey and hasUnset.
	 */
	private getOption<T extends boolean | number | string>(name: string): OptionData<T> {
		const nameLower = name.toLowerCase();
		const option = this.interaction.isChatInputCommand()
			? this.interaction.options.get(nameLower)
			: null;
		if (!option) {
			return { name, nameLower, hasKey:false, hasUnset:false };
		}

		// value for channel, mentionable, role, user should be the snowflake
		const { type, value } = option;
		const stringValue = value !== undefined ? String(value) : undefined;
		const hasUnset = stringValue ? /^\s*unset\s*$/i.test(stringValue) : false;
		return {
			name,
			nameLower,
			type,
			value: hasUnset ? null : value as T,
			stringValue: hasUnset ? null : stringValue,
			hasKey:true,
			hasUnset
		};
	}

	/** Returns a list of all argument keys passed to the command. */
	public keys(): string[] {
		return this.interaction.options?.data.map(opt => opt.name) ?? [];
	}

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean {
		return this.getOption(name).hasKey;
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean {
		return this.getOption(name).hasUnset;
	}

	/**
	 * Gets the named option as an attachment.
	 * Returns undefined if not found.
	 * Returns null if not a valid attachment or "unset".
	 */
	public getAttachment(name: string): Optional<Attachment> {
		const { nameLower, hasKey, hasUnset } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		const attachment = this.interaction.options.get(nameLower)?.attachment;
		if (attachment instanceof Attachment) {
			return attachment;
		}
		return null;
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public getBoolean(name: string): Optional<boolean> {
		return this.getOption<boolean>(name).value;
	}

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getChannel(name: string): Optional<MessageChannel> {
		const { nameLower, hasKey, hasUnset } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		return this.interaction.options.get(nameLower)?.channel as MessageChannel ?? null;
	}

	public findEnum<K extends string = string, V extends number = number>(_type: EnumLike<K, V>): Optional<V> {
		return undefined;
	}

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	public getNumber(name: string): Optional<number> {
		return this.getOption<number>(name).value;
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getRole(name: string): Optional<Role> {
		const { nameLower, hasKey, hasUnset } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		const role = this.interaction.options.get(nameLower)?.role;
		if (role instanceof Role) {
			return role;
		}
		return null;
	}

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getString<U extends string = string>(name: string): Optional<U> {
		return this.getOption(name).stringValue as U;
	}

	/**
	 * Gets the named option as a User.
	 * Returns undefined if not found.
	 * Returns null if not a valid User or "unset".
	 */
	public getUser(name: string): Optional<User> {
		const { nameLower, hasKey, hasUnset } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		const mentionable = this.interaction.options.get(nameLower)?.user;
		if (mentionable instanceof GuildMember) {
			return mentionable.user;
		}else if (mentionable instanceof User) {
			return mentionable;
		}
		return null;
	}

}