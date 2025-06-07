import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import { isDMBasedChannel } from "../types/typeGuards/isDMBasedChannel.js";
import { getPermsFor } from "./getPermsFor.js";
import { isLockedOrArchivedThread } from "./internal/isLockedOrArchivedThread.js";

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

	if (isDMBasedChannel(channel)) {
		return true;
	}


	if (isLockedOrArchivedThread(channel) && !channel.sendable) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.canSendMessages;
}
