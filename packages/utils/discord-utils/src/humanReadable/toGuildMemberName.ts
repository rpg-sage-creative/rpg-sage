import type { Optional } from "@rsc-utils/core-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import type { GuildMember } from "discord.js";
import { toUserName } from "./toUserName.js";

/** Returns the guild member as a readable mention or "@UnknownGuildMember" */
export function toGuildMemberName(member: Optional<GuildMember>): string {
	if (member) {
		if (member.nickname) {
			return `@${ZERO_WIDTH_SPACE}${member.nickname}`;
		}
		return toUserName(member.user);
	}
	return "@UnknownGuildMember";
}