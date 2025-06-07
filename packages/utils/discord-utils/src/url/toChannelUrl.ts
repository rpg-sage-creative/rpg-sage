import type { Optional } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import { isGuildBasedChannel } from "../types/typeGuards/isGuildBasedChannel.js";
import type { MessageOrPartial, MessageReferenceOrPartial } from "../types/types.js";

function createUrl(guildId: Optional<string>, channelId: string): string {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}`;
}

type ChannelResolvable = Channel | MessageOrPartial | MessageReferenceOrPartial;
export function toChannelUrl(ref: ChannelResolvable): string;
export function toChannelUrl(ref: Optional<ChannelResolvable>): string | undefined;
export function toChannelUrl(ref: Optional<ChannelResolvable>): string | undefined {
	if (ref) {
		if ("channelId" in ref) {
			return createUrl(ref.guildId, ref.channelId);
		}
		if (isGuildBasedChannel(ref)) {
			return createUrl(ref.guildId, ref.id);
		}
		/** @todo do we need to test and handle isDMBased(ref) ? */
		return createUrl(undefined, ref.id);
	}
	return undefined;
}