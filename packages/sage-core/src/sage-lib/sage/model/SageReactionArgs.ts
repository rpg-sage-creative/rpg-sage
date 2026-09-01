import type { Optional } from "@rsc-utils/core-utils";
import type { SupportedMessagesChannel } from "@rsc-utils/discord-utils";
import type { Attachment, Role, User } from "discord.js";
import { SageCommandArgs } from "./SageCommandArgs.js";
import type { SageReaction } from "./SageReaction.js";

export class SageReactionArgs extends SageCommandArgs<SageReaction> {

	/** Returns a list of all argument keys passed to the command. */
	public keys(): string[] {
		return [];
	}

	/** Returns true if an argument matches the given key, regardless of value. */
	public hasKey(name: string): boolean;
	public hasKey(): boolean {
		return false;
	}

	/** Returns true if the argument matching the given key has the value "unset". */
	public hasUnset(name: string): boolean;
	public hasUnset(): boolean {
		return false;
	}

	/**
	 * Gets the named option as an attachment.
	 * Returns undefined if not found.
	 * Returns null if not a valid attachment or "unset".
	 */
	public getAttachment(): Optional<Attachment> {
		return undefined;
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public getBoolean(): Optional<boolean> {
		return false;
	}

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public getChannel(): Optional<SupportedMessagesChannel> {
		return null;
	}

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	public getNumber(): Optional<number> {
		return null;
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid Role or "unset".
	 */
	public getRole(): Optional<Role> {
		return null;
	}

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getString<U extends string = string>(): Optional<U> {
		return null;
	}

	/**
	 * Gets the named option as a User.
	 * Returns undefined if not found.
	 * Returns null if not a valid User or "unset".
	 */
	public getUser(name: string): Optional<User>;
	/** Gets the named option as a User */
	public getUser(name: string, required: true): User;
	public getUser(): Optional<User> {
		return null;
	}

}