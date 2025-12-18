import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, PartialUser, User } from "discord.js";

export function isUser(value: Optional<Channel | User | PartialUser>): value is User | PartialUser {
	return value ? "createDM" in value : false;
}