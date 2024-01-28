import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { Channel, Message, MessageReference } from "discord.js";
import type { DiscordKey } from "../DiscordKey.js";

function createUrl(guildId: Optional<Snowflake>, channelId: Snowflake): string {
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