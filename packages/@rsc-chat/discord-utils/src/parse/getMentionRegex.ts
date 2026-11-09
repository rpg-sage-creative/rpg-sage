import type { Snowflake } from "@rsc-utils/id-utils";
import { globalizeRegExp, type TypedRegExp } from "@rsc-utils/regexp-utils";

type MentionType = "channel" | "role" | "user";

const ChannelMentionRegExp = (/<#(?<channelId>\d{16,})>/) as TypedRegExp<{ channelId:Snowflake; }>;
const ChannelMentionRegExpG = globalizeRegExp(ChannelMentionRegExp);

const RoleMentionRegExp = (/<@&(?<roleId>\d{16,})>/) as TypedRegExp<{ roleId:Snowflake; }>;
const RoleMentionRegExpG = globalizeRegExp(RoleMentionRegExp);

const UserMentionRegExp = (/<@\!?(?<userId>\d{16,})>/) as TypedRegExp<{ userId:Snowflake; }>;
const UserMentionRegExpG = globalizeRegExp(UserMentionRegExp);

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