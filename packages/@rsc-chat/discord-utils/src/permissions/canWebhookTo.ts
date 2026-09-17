import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import type { SupportedChannel } from "../types/typeGuards/isSupported.js";
import { getPermsFor } from "./getPermsFor.js";
import { isLockedOrArchivedThread } from "./internal/isLockedOrArchivedThread.js";

export function canWebhookTo(botId: Snowflake, channel: Optional<SupportedChannel>): boolean {
	if (!channel) {
		return false;
	}

	if (channel.isDMBased()) {
		return false;
	}

	if (isLockedOrArchivedThread(channel)) {
		return false;
	}

	const perms = getPermsFor(channel, botId);
	return perms.can("WebhookTo");
}
