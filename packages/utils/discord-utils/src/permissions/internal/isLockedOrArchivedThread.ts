import type { AnyThreadChannel, Channel } from "discord.js";
import { isThreadChannel } from "../../types/typeGuards/isThreadChannel.js";

export function isLockedOrArchivedThread(channel: Channel): channel is AnyThreadChannel {
	if (isThreadChannel(channel)) {
		if (channel.locked) {
			return true;
		}
		if (channel.archived && !channel.unarchivable) {
			return true;
		}
	}
	return false;
}