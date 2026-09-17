import { globalizeRegex, type Snowflake, type TypedRegExp } from "@rsc-utils/core-utils";

type MentionType = "channel" | "role" | "user";

const ChannelMentionRegExp = (/<#(?<channelId>\d{16,})>/) as TypedRegExp<{ channelId:Snowflake; }>;
const ChannelMentionRegExpG = globalizeRegex(ChannelMentionRegExp);

const RoleMentionRegExp = (/<@&(?<roleId>\d{16,})>/) as TypedRegExp<{ roleId:Snowflake; }>;
const RoleMentionRegExpG = globalizeRegex(RoleMentionRegExp);

const UserMentionRegExp = (/<@\!?(?<userId>\d{16,})>/) as TypedRegExp<{ userId:Snowflake; }>;
const UserMentionRegExpG = globalizeRegex(UserMentionRegExp);

/** Returns a TypedRegExp with one of the following capture groups: channelId, roleId, or userId */
export function getMentionRegex(type: MentionType, global?: boolean): RegExp {
	if (global) {
		if (type === "channel") return ChannelMentionRegExpG;
		if (type === "role") return RoleMentionRegExpG;
		return UserMentionRegExpG;
	}
	if (type === "channel") return ChannelMentionRegExp;
	if (type === "role") return RoleMentionRegExp;
	return UserMentionRegExp;
}