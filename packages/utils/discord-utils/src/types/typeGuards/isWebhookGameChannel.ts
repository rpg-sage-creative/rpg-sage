import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, ForumChannel, TextChannel } from "discord.js";
import type { UserOrPartial } from "../types.js";
import { isGameChannel } from "./isGameChannel.js";

/** Channels Sage can get webhooks from. */
export type WebhookGameChannel = TextChannel | ForumChannel;

export function isWebhookGameChannel(channel?: Optional<Channel | UserOrPartial>): channel is WebhookGameChannel {
	return isGameChannel(channel) && "fetchWebhooks" in channel;
}
