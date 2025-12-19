import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { getPermsFor } from "./getPermsFor.js";
import { isLockedOrArchivedThread } from "./internal/isLockedOrArchivedThread.js";
import type { SupportedChannel } from "../types/typeGuards/isSupported.js";

export function canReactTo(botId: Snowflake, channel: Optional<SupportedChannel>): boolean {
	if (!channel) {
		return false;
	}

	if (channel.isDMBased()) {
		return true;
	}

	if (isLockedOrArchivedThread(channel)) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.can("AddReactions");
}