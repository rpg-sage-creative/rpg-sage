import type { Optional } from "@rsc-utils/core-utils";
import type { MessageOrPartial, MessageReferenceOrPartial } from "../types/types.js";

function createUrl(guildId: Optional<string>, channelId: string, messageId: string): string {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}/${messageId}`;
}

export function toMessageUrl(ref: MessageOrPartial | MessageReferenceOrPartial): string | undefined {
	if ("messageId" in ref) {
		if (ref.messageId) {
			return createUrl(ref.guildId, ref.channelId, ref.messageId);
		}
	}else {
		if (ref.url) {
			return ref.url;
		}
		if (ref.id) {
			return createUrl(ref.guildId, ref.channelId, ref.id);
		}
	}
	return undefined;
}
