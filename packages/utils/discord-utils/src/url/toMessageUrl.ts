import type { Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { MessageReference } from "discord.js";
import type { DiscordKey } from "../DiscordKey.js";
import type { DMessage } from "../types.js";

function createUrl(guildId: Optional<Snowflake>, channelId: Snowflake, messageId: Snowflake): string {
	return `https://discord.com/channels/${guildId ?? "@me"}/${channelId}/${messageId}`;
}

export function toMessageUrl(ref: DiscordKey | DMessage | MessageReference): string | null {
	if ("messageId" in ref) {
		if (ref.messageId) {
			return createUrl(ref.guildId, ref.channelId, ref.messageId);
		}
	}else if (ref.id) {
		return createUrl(ref.guildId, ref.channelId, ref.id);
	}
	return null;
}