import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, GuildBasedChannel } from "discord.js";
import type { UserOrPartial } from "../types.js";
import { isChannel } from "./isChannel.js";

export function isGuildBasedChannel(value: Optional<Channel | UserOrPartial>): value is GuildBasedChannel {
	return isChannel(value) && "guild" in value;
}
