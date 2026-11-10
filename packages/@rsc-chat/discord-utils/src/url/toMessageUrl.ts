import type { Optional } from "@rsc-utils/type-utils";
import type { MessageOrPartial, MessageReferenceOrPartial } from "../types/types.js";

function createUrl(guildId: Optional<string>, channelId: string, messageId: string): string {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}/${messageId}`;
}

export function toMessageUrl(ref: Optional<MessageOrPartial | MessageReferenceOrPartial>): string | undefined {
	if (ref) {
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
	}
	console.log("%j", ref);
	return undefined;
}
