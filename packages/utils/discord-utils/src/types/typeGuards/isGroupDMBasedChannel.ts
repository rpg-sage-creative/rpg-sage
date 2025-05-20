import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, PartialGroupDMChannel } from "discord.js";
import type { UserOrPartial } from "../types.js";
import { isDMBasedChannel } from "./isDMBasedChannel.js";

export function isGroupDMBasedChannel(value: Optional<Channel | UserOrPartial>): value is PartialGroupDMChannel {
	return isDMBasedChannel(value) && "recipients" in value;
}
