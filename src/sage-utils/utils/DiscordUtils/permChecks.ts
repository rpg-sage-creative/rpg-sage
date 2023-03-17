import { ChannelType, PermissionFlagsBits, Snowflake } from "discord.js";
import type { Optional } from "../..";
import type { DChannel } from "./types";

/**
 * Determines if we can send messages to the given channel.
 * If not a text channel, always false.
 * If a DM channel, always true.
 * If a locked or unarchivable thread, return false.
 * Otherwise, we check the bot's perms to see if it has SEND_MESSAGES or SEND_MESSAGES_IN_THREADS as appropriate.
 * @returns true if we can send to the channel
 */
export function canSendMessageTo(botId: Snowflake, channel: Optional<DChannel>): boolean {
	const types = [ChannelType.GuildText, ChannelType.DM, ChannelType.PrivateThread, ChannelType.PublicThread, ChannelType.GuildForum];
	if (channel && types.includes(channel.type)) {
		if (channel.isDMBased()) {
			return true;
		}

		if (channel.isThread()) {
			/** @todo look into checking channel.sendable */
			if (channel.locked) {
				return false;
			}
			if (channel.archived && !channel.unarchivable) {
				return false;
			}
		}

		const perms = channel.permissionsFor(botId, true);
		const perm = channel.isThread() ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages;
		return perms?.has(perm) ?? false;
	}
	return false;
}

export function canReactTo(botId: Snowflake, channel: Optional<DChannel>): boolean {
	const types = [ChannelType.GuildText, ChannelType.DM, ChannelType.PrivateThread, ChannelType.PublicThread, ChannelType.GuildForum];
	if (channel && types.includes(channel.type)) {
		if (channel.isDMBased()) {
			return true;
		}

		if (channel.isThread()) {
			/** @todo look into checking channel.sendable */
			if (channel.locked) {
				return false;
			}
			if (channel.archived && !channel.unarchivable) {
				return false;
			}
		}

		const perms = channel.permissionsFor(botId, true);
		return perms?.has(PermissionFlagsBits.AddReactions) ?? false;
	}
	return false;
}