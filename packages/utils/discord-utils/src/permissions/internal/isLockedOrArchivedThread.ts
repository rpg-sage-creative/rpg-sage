import type { SupportedChannel, SupportedThreadChannel } from "../../types/typeGuards/isSupported.js";

export function isLockedOrArchivedThread(channel: SupportedChannel): channel is SupportedThreadChannel {
	if (channel.isThread()) {
		if (channel.locked) {
			return true;
		}
		if (channel.archived && !channel.unarchivable) {
			return true;
		}
	}
	return false;
}