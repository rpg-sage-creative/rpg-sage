import type { Optional } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import type { DMBasedChannel, UserOrPartial } from "../types.js";
import { isChannel } from "./isChannel.js";

export function isDMBasedChannel(value: Optional<Channel | UserOrPartial>): value is DMBasedChannel {
	return isChannel(value) && value.isDMBased();
}
