import type { Optional } from "@rsc-utils/core-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import type { APIUser, PartialRecipient, PartialUser, User } from "discord.js";

type UserResolvable = User | PartialUser | APIUser | PartialRecipient;

/** Returns the user name as a readable mention or "@UnknownUser" */
export function toUserName(user: Optional<UserResolvable>): string {
	if (user) {
		if ("displayName" in user && user.displayName) {
			return `@${ZERO_WIDTH_SPACE}${user.displayName}`;
		}
		if ("discriminator" in user) {
			const discriminator = (user.discriminator ?? "0") !== "0" ? `#${user.discriminator}` : ``;
			return `@${ZERO_WIDTH_SPACE}${user.username}${discriminator}`;
		}
		return `@${ZERO_WIDTH_SPACE}${user.username}`;
	}
	return "@UnknownUser";
}