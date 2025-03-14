import type { Optional } from "@rsc-utils/core-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import type { APIUser, PartialRecipient, PartialUser, User } from "discord.js";

type UserResolvable = User | PartialUser | APIUser | PartialRecipient;

export function addZeroWidthSpaces(value: string): string {
	return value
		// avoid @here and @everybody
		.replace(/@(?!\u200B)/g, `@${ZERO_WIDTH_SPACE}`)
		// fix spoilers
		.replace(/(?<!\u200B)\|/g, `${ZERO_WIDTH_SPACE}|`)
		;
}

/** Returns the user name as a readable mention or "@UnknownUser" */
export function toUserName(user: Optional<UserResolvable>): string {
	if (user) {
		if ("displayName" in user && user.displayName) {
			return addZeroWidthSpaces(`@${user.displayName}`);
		}
		if ("discriminator" in user) {
			const discriminator = (user.discriminator ?? "0") !== "0" ? `#${user.discriminator}` : ``;
			return addZeroWidthSpaces(`@${user.username}${discriminator}`);
		}
		return addZeroWidthSpaces(`@${user.username}`);
	}
	return "@UnknownUser";
}