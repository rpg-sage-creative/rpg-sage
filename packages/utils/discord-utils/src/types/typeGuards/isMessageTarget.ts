import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, PartialUser, User } from "discord.js";
import type { MessageChannel } from "../types.js";

export function isMessageTarget(value: Optional<Channel | User | PartialUser>): value is MessageChannel | User | PartialUser {
	return value ? "send" in value : false;
}