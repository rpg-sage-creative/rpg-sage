import { type Optional } from "@rsc-utils/core-utils";
import { type Channel, type Message, type MessageReference } from "discord.js";
import { type DiscordKey } from "../DiscordKey.js";

function createUrl(guildId: Optional<string>, channelId: string): string {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}`;
}

export function toChannelUrl(ref: Channel | DiscordKey | Message | MessageReference): string {
	if ("channelId" in ref) {
		return createUrl(ref.guildId, ref.channelId);
	}
	if ("guildId" in ref && typeof(ref.guildId) === "string") {
		return createUrl(ref.guildId, ref.id);
	}
	return createUrl(null, ref.id);
}