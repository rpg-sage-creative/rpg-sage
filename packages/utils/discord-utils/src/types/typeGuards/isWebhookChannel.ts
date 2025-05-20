import type { Optional } from "@rsc-utils/core-utils";
import type { Channel } from "discord.js";
import type { UserOrPartial, WebhookChannel } from "../types.js";
import { isChannel } from "./isChannel.js";

export function isWebhookChannel(value: Optional<Channel | UserOrPartial>): value is WebhookChannel {
	return isChannel(value) && "fetchWebhooks" in value;
}
