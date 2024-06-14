import { type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { createDiscordUrlRegex } from "./createDiscordUrlRegex.js";
import { createMentionRegex } from "./createMentionRegex.js";

type IdType = "channel" | "message" | "role" | "user";

type GroupKey = "channelId" | "messageId" | "roleId" | "userId";
function getGroupKey(type: IdType): GroupKey {
	switch(type) {
		case "channel": return "channelId";
		case "message": return "messageId";
		case "role": return "roleId";
		case "user": default: return "userId";
	}
}

export function parseId(value: Optional<string>, type: IdType): Snowflake | undefined {
	if (value) {
		const groupKey = getGroupKey(type);

		if (type !== "message") {
			const mentionRegex = createMentionRegex(type, { anchored:true });
			const mentionMatch = mentionRegex.exec(value);
			if (mentionMatch?.groups?.[groupKey]) {
				return mentionMatch.groups[groupKey] as Snowflake; //NOSONAR
			}
		}

		if (type !== "role" && type !== "user") {
			const urlRegex = createDiscordUrlRegex(type);
			const urlMatch = urlRegex.exec(value);
			if (urlMatch?.groups?.[groupKey]) {
				return urlMatch.groups[groupKey] as Snowflake; //NOSONAR
			}
		}
	}
	return undefined;
}