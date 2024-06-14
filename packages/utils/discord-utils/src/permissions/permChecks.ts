import { type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { type AnyThreadChannel, type Channel } from "discord.js";
import { isDMBased, isThread } from "../typeChecks.js";
import { getPermsFor } from "./getPermsFor.js";

function isLockedOrArchivedThread(channel: Channel): channel is AnyThreadChannel {
	if (isThread(channel)) {
		if (channel.locked) {
			return true;
		}
		if (channel.archived && !channel.unarchivable) {
			return true;
		}
	}
	return false;
}

/**
 * Determines if we can send messages to the given channel.
 * If not a text channel, always false.
 * If a DM channel, always true.
 * If a locked or unarchivable thread, return false.
 * Otherwise, we check the bot's perms to see if it has SEND_MESSAGES or SEND_MESSAGES_IN_THREADS as appropriate.
 * @returns true if we can send to the channel
 */
export function canSendMessageTo(botId: Snowflake, channel: Optional<Channel>): boolean {
	if (!channel) {
		return false;
	}

	if (isDMBased(channel)) {
		return true;
	}


	if (isLockedOrArchivedThread(channel) && !channel.sendable) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.canSendMessages;
}

export function canReactTo(botId: Snowflake, channel: Optional<Channel>): boolean {
	if (!channel) {
		return false;
	}

	if (isDMBased(channel)) {
		return true;
	}

	if (isLockedOrArchivedThread(channel)) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.canAddReactions;
}

export function canWebhookTo(botId: Snowflake, channel: Optional<Channel>): boolean {
	if (!channel) {
		return false;
	}

	if (isDMBased(channel)) {
		return false;
	}

	if (isLockedOrArchivedThread(channel)) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.canSendWebhooks;
}
