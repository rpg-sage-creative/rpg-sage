import { isNonNilSnowflake, type Optional, type Snowflake } from "@rsc-utils/core-utils";
import { type Collection, type Message } from "discord.js";
import { createDiscordUrlRegex } from "./createDiscordUrlRegex.js";
import { createMentionRegex } from "./createMentionRegex.js";

type MentionIdType = "channel" | "role" | "user";
type UrlIdType = "channel" | "message";
type IdType = MentionIdType | UrlIdType;

/** Validate MentionIdType */
function isMentionIdType(type: IdType): type is MentionIdType {
	return ["channel", "role", "user"].includes(type);
}

/** Validate UrlIdType */
function isUrlIdType(type: IdType): type is UrlIdType {
	return ["channel", "message"].includes(type);
}

/** RegExp match group key */
type GroupKey = "channelId" | "messageId" | "roleId" | "userId";

/** Get GroupKey for the IdType */
function getGroupKey(type: IdType): GroupKey { // NOSONAR
	switch(type) {
		case "channel": return "channelId";
		case "message": return "messageId";
		case "role": return "roleId";
		case "user": return "userId";
	}
}

/** Key of Collection in message.mentions */
type MentionKey = "channels" | "roles" | "users";

/** Get the proper Collection key for the MentionIdType */
function getMentionKey(type: MentionIdType): MentionKey { // NOSONAR
	switch(type) {
		case "channel": return "channels";
		case "role": return "roles";
		case "user": return "users";
	}
}

/** Reusable type for Snowflake | string | undefined. */
type PossibleSnowflake = Snowflake | string | undefined;

/** Parses the content for mentions of the given IdType and returns the id/snowflakes. */
function getContentMentionIds(type: IdType, content: Optional<string>): PossibleSnowflake[] {
	if (isMentionIdType(type) && content) {
		const globalRegex = createMentionRegex(type, { globalFlag:true });
		const mentions = content.match(globalRegex) ?? []; // NOSONAR
		if (mentions.length) {
			const regex = createMentionRegex(type);
			return mentions.map(mention => regex.exec(mention)?.groups?.[getGroupKey(type)]);
		}
	}
	return [];
}

/** Reusable type for objects that have Snowflake id values. */
type HasId = { id:Snowflake; };

/** Gets the ids from the Collection for the given IdType. */
function getMessageMentionIds(type: IdType, message: Message): PossibleSnowflake[] {
	if (isMentionIdType(type)) {
		const collection = message.mentions[getMentionKey(type)] as Collection<Snowflake, HasId>;
		return collection.map(mention => mention.id);
	}
	return [];
}

/** Parses the content for urls of the given IdType and returns the ids/snowflakes. */
function getContentUrlIds(type: IdType, content: Optional<string>): PossibleSnowflake[] {
	if (isUrlIdType(type) && content) {
		const globalRegex = createDiscordUrlRegex(type, { globalFlag:true });
		const urls = content.match(globalRegex) ?? []; // NOSONAR
		if (urls.length) {
			const regex = createDiscordUrlRegex(type);
			return urls.map(url => regex.exec(url)?.groups?.[getGroupKey(type)]);
		}
	}
	return [];
}

/** A filter that only returns unique nonNil snowflakes. */
function uniqueNonNilSnowflakeFilter(value: PossibleSnowflake, index: number, array: PossibleSnowflake[]): value is Snowflake {
	return isNonNilSnowflake(value) && array.indexOf(value) === index;
}

/** Returns all unique nonNil Snowflakes of the given IdType from the given Message. */
export function parseIds(messageOrContent: Message | string, type: IdType, includeRaw?: boolean): Snowflake[] {
	const isString = typeof(messageOrContent) === "string";
	const content = isString ? messageOrContent : messageOrContent.content;
	const message = isString ? undefined : messageOrContent;
	const contentMentionIds = getContentMentionIds(type, content);
	const contentUrlIds = getContentUrlIds(type, content);
	const mentionIds = message ? getMessageMentionIds(type, message) : [];
	const rawIds = includeRaw ? (content ?? "").match(/\d{16,}/g) ?? [] : [];
	return [...contentMentionIds, ...contentUrlIds, ...mentionIds, ...rawIds].filter(uniqueNonNilSnowflakeFilter);
}
