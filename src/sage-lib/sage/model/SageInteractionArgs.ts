import { isNonNilSnowflake, type Optional } from "@rsc-utils/core-utils";
import type { SupportedChannel } from "@rsc-utils/discord-utils";
import { ApplicationCommandOptionType, Attachment, AutocompleteInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, GuildMember, Role, User, type CommandInteractionOption } from "discord.js";
import { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageInteraction } from "./SageInteraction.js";

type HandledInteraction = AutocompleteInteraction | ChatInputCommandInteraction | ContextMenuCommandInteraction;

type OptionData<T extends boolean | number | string> = {
	name: string;
	hasKey: boolean;
	hasUnset: boolean;
	type?: ApplicationCommandOptionType;
	value?: T | null;
	stringValue?: string | null;
	option?: CommandInteractionOption;
};

export class SageInteractionArgs extends SageCommandArgs<SageInteraction> {

	private get interaction() { return this.sageCommand.interaction as HandledInteraction; }

	private get options() {
		const { interaction } = this;
		if (interaction.isAutocomplete()) return interaction.options;
		if (interaction.isChatInputCommand()) return interaction.options;
		if (interaction.isContextMenuCommand()) return interaction.options;
		return undefined;
	}

	/**
	 * Looks for the option by name.
	 * If no key is found, then .hasKey is false and .value is undefined.
	 * If the key is found, but the String(value) is /unset/ then .hasUnset is true and .value is null.
	 * Otherwise, the value is returned as found.
	 * This allows for returning .getOption(name).value to properly reflect hasKey and hasUnset.
	 */
	private getOption<T extends boolean | number | string>(name: string): OptionData<T> {
		const nameLower = name.toLowerCase();
		const option = this.options?.get(nameLower);
		if (!option) {
			return { name, hasKey:false, hasUnset:false };
		}

		// value for channel, mentionable, role, user should be the snowflake
		const { type, value } = option;
		const stringValue = value !== undefined ? String(value) : undefined;
		const hasUnset = stringValue ? /^\s*unset\s*$/i.test(stringValue) : false;
		return {
			name,
			type,
			value: hasUnset ? null : value as T,
			stringValue: hasUnset ? null : stringValue,
			hasKey: true,
			hasUnset,
			option
		};
	}

	/** Returns a list of all argument keys passed to the command. */
	public keys(): string[] {
		return this.options?.data.map(opt => opt.name) ?? [];
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
		const { hasKey, hasUnset, option } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		const attachment = option?.attachment;
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
	public getChannel(name: string): Optional<SupportedChannel> {
		const { hasKey, hasUnset, option } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		return option?.channel as SupportedChannel;
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
		const { hasKey, hasUnset, option } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		const role = option?.role;
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
		const { hasKey, hasUnset, option, stringValue } = this.getOption(name);
		if (!hasKey) return undefined; //NOSONAR
		if (hasUnset) return null; //NOSONAR
		const mentionable = option?.user;
		if (mentionable instanceof GuildMember) {
			return mentionable.user;
		}else if (mentionable instanceof User) {
			return mentionable;
		}
		const trimmed = stringValue?.trim();
		if (isNonNilSnowflake(trimmed)) {
			return this.sageCommand.discord.client.users.cache.get(trimmed) ?? null;
		}
		return null;
	}

}