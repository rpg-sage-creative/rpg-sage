import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import { isDMBasedChannel } from "../types/typeGuards/isDMBasedChannel.js";
import { getPermsFor } from "./getPermsFor.js";
import { isLockedOrArchivedThread } from "./internal/isLockedOrArchivedThread.js";

export function canReactTo(botId: Snowflake, channel: Optional<Channel>): boolean {
	if (!channel) {
		return false;
	}

	if (isDMBasedChannel(channel)) {
		return true;
	}

	if (isLockedOrArchivedThread(channel)) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.canAddReactions;
}