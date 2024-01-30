import { type Snowflake, isNonNilSnowflake } from "@rsc-utils/snowflake-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { createMentionRegex } from "./createMentionRegex.js";
import { createDiscordUrlRegex } from "./createDiscordUrlRegex.js";
import { type DMessage } from "../types.js";

type IdType = "channel";

type GroupKey = "channelId";
function getGroupKey(type: IdType): GroupKey {
	switch(type) {
		case "channel": return "channelId";
	}
}

type MentionKey = "channels";
function getMentionKey(type: IdType): MentionKey {
	switch(type) {
		case "channel": return "channels";
	}
}

type PossibleSnowflake = Snowflake | undefined;

function getContentMentionIds(type: IdType, content: Optional<string>): PossibleSnowflake[] {
	if (content) {
		const globalRegex = createMentionRegex(type, { globalFlag:true });
		const mentions = content.match(globalRegex) ?? [];
		if (mentions.length) {
			const regex = createMentionRegex(type);
			return mentions.map(mention => regex.exec(mention)?.groups?.[getGroupKey(type)]);
		}
	}
	return [];
}

function getContentUrlIds(type: IdType, content: Optional<string>): PossibleSnowflake[] {
	if (content) {
		const globalRegex = createDiscordUrlRegex(type, { globalFlag:true });
		const urls = content.match(globalRegex) ?? [];
		if (urls.length) {
			const regex = createDiscordUrlRegex(type);
			return urls.map(url => regex.exec(url)?.groups?.[getGroupKey(type)]);
		}
	}
	return [];
}

function uniqueNonNilSnowflakeFilter(value: PossibleSnowflake, index: number, array: PossibleSnowflake[]): value is Snowflake {
	return array.indexOf(value) === index && isNonNilSnowflake(value);
}

export function parseIds(message: DMessage, type: IdType): Snowflake[] {
	const contentMentionIds = getContentMentionIds(type, message.content);
	const contentUrlIds = getContentUrlIds(type, message.content);
	const mentionIds = message.mentions[getMentionKey(type)].map(mention => mention.id);
	return [...contentMentionIds, ...contentUrlIds, ...mentionIds].filter(uniqueNonNilSnowflakeFilter);
}