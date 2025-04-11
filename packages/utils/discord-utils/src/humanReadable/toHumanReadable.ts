import type { Optional } from "@rsc-utils/core-utils";
import type { Channel, Guild, GuildMember, GuildPreview, Webhook } from "discord.js";
import type { MessageOrPartial, UserResolvable } from "../types/types.js";
import { toChannelName } from "./toChannelName.js";
import { toGuildMemberName } from "./toGuildMemberName.js";
import { toGuildName } from "./toGuildName.js";
import { toUserName } from "./toUserName.js";
import { toWebhookName } from "./toWebhookName.js";

export type Readable = Channel | Guild | GuildPreview | GuildMember | MessageOrPartial | UserResolvable | Webhook;

/**
 * Returns a string that represents the Discord object in a meaningful way.
 * Channels/Messages become: #channel-name
 * Guilds become: Guild Name
 * Users/GuildMembers become: @UserName.
 * Webhooks become: $WebhookName
 */
export function toHumanReadable<T extends Readable>(target: T): string;
export function toHumanReadable<T extends Readable>(target: Optional<T>): string | undefined;
export function toHumanReadable<T extends Readable>(target: Optional<T>): string | undefined {
	if (target) {
		// Webhook
		if ("token" in target) {
			return toWebhookName(target);
		}

		// GuildMember or UserResolvable
		if ("createDM" in target) {
			if ("user" in target) {
				return toGuildMemberName(target);
			}else {
				return toUserName(target);
			}
		}

		// UserResolvable
		if ("username" in target) {
			return toUserName(target);
		}

		// Message or PartialMessage
		if ("channel" in target) {
			return toChannelName(target);
		}

		// Guild or GuildPreview
		if ("discoverySplash" in target) {
			return toGuildName(target);
		}

		// Channel
		return toChannelName(target);
	}

	return undefined;
}