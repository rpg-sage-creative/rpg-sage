import type { MessageOrPartial } from "../../types/types.js";
import { toUserName } from "../toUserName.js";
import { channelToName } from "./channelToName.js";

/** @internal */
export function messageToChannelName(message: MessageOrPartial): string {
	const author = toUserName(message.author);
	if (message.guild) {
		return channelToName(message.channel) + author;
	}else {
		return author;
	}
}