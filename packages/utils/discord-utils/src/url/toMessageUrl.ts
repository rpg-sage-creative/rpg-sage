import { type Optional } from "@rsc-utils/core-utils";
import { type MessageReference } from "discord.js";
import { type MessageOrPartial } from "../types.js";

function createUrl(guildId: Optional<string>, channelId: string, messageId: string): string {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}/${messageId}`;
}

export function toMessageUrl(ref: MessageOrPartial | MessageReference): string | undefined {
	if ("messageId" in ref) {
		if (ref.messageId) {
			return createUrl(ref.guildId, ref.channelId, ref.messageId);
		}
	}else if (ref.id) {
		return createUrl(ref.guildId, ref.channelId, ref.id);
	}
	return undefined;
}
