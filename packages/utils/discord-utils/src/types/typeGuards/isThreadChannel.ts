import type { Optional } from "@rsc-utils/core-utils";
import type { AnyThreadChannel, Channel } from "discord.js";
import type { UserOrPartial } from "../types.js";
import { isChannel } from "./isChannel.js";

export function isThreadChannel(value: Optional<Channel | UserOrPartial>): value is AnyThreadChannel {
	return isChannel(value) && value.isThread();
}
