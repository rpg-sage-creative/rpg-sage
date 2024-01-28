import { type Snowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { createMentionRegex } from "./createMentionRegex.js";
import { createDiscordUrlRegex } from "./createDiscordUrlRegex.js";

type IdType = "channel" | "message" | "role" | "user";

type GroupKey = "channelId" | "messageId" | "roleId" | "userId";
function getGroupKey(type: IdType): GroupKey {
	switch(type) {
		case "channel": return "channelId";
		case "message": return "messageId";
		case "role": return "roleId";
		case "user": return "userId";
	}
}

export function parseId(value: Optional<string>, type: IdType): Snowflake | null {
	if (value) {
		const groupKey = getGroupKey(type);

		if (type !== "message") {
			const mentionRegex = createMentionRegex(type, { anchored:true });
			const mentionMatch = mentionRegex.exec(value);
			if (mentionMatch?.groups?.[groupKey]) {
				return mentionMatch.groups[groupKey];
			}
		}

		if (type !== "role" && type !== "user") {
			const urlRegex = createDiscordUrlRegex(type);
			const urlMatch = urlRegex.exec(value);
			if (urlMatch?.groups?.[groupKey]) {
				return urlMatch.groups[groupKey];
			}
		}
	}
	return null;
}