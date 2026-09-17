import type { Optional } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import type { MessageOrPartial } from "../types/types.js";
import { channelToName } from "./internal/channelToName.js";
import { messageToChannelName } from "./internal/messageToChannelName.js";

/** Returns the name of the channel as a readable reference. */
export function toChannelName(channel: Optional<Channel | MessageOrPartial>): string | undefined;

/** Returns the name of the message's channel as a readable reference. */
export function toChannelName(message: Optional<MessageOrPartial>): string | undefined;

export function toChannelName(value: Optional<Channel | MessageOrPartial>): string | undefined {
	if (value) {
		if ("channelId" in value) {
			return messageToChannelName(value);
		}
		return channelToName(value);
	}
	return undefined;
}
