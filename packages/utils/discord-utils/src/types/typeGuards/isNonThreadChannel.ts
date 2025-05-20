import type { Optional } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import type { NonThreadChannel, UserOrPartial } from "../types.js";
import { isChannel } from "./isChannel.js";

export function isNonThreadChannel(value: Optional<Channel | UserOrPartial>): value is NonThreadChannel {
	return isChannel(value) && !value.isThread();
}
