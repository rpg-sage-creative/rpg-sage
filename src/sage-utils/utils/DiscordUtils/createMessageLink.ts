import { MessageReference } from "discord.js";
import { DMessage as _DMessage } from "./types";
import { DMessage } from "../../../sage-lib/discord";

export function createMessageLink(msgOrRef: DMessage): string;
export function createMessageLink(msgOrRef: _DMessage): string;
export function createMessageLink(msgOrRef: MessageReference): string;
export function createMessageLink(msgOrRef: DMessage | _DMessage | MessageReference): string {
	if ("messageId" in msgOrRef) {
		return `https://discord.com/channels/${msgOrRef.guildId}/${msgOrRef.channelId}/${msgOrRef.messageId}`;
	}
	return `https://discord.com/channels/${msgOrRef.guildId}/${msgOrRef.channelId}/${msgOrRef.id}`;
}