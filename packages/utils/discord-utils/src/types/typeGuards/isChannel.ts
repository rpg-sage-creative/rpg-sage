import type { Optional } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import type { UserOrPartial } from "../types.js";

export function isChannel(value: Optional<Channel | UserOrPartial>): value is Channel {
	return value ? "isThread" in value : false;
}
