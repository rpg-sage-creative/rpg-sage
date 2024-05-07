import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { isDMBased } from "../typeChecks.js";
import type { DChannel } from "../types.js";
import { getPermsFor } from "./getPermsFor.js";

function isLockedOrArchivedThread(channel: DChannel): boolean {
	if (channel.isThread()) {
		/** @todo look into checking channel.sendable */
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
export function canSendMessageTo(botId: Snowflake, channel: Optional<DChannel>): boolean {
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
	return perms.canSendMessages;
}

export function canReactTo(botId: Snowflake, channel: Optional<DChannel>): boolean {
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

export function canWebhookTo(botId: Snowflake, channel: Optional<DChannel>): boolean {
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
