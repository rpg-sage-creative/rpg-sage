import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import type { Optional } from "@rsc-utils/type-utils";
import type { APIUser } from "discord-api-types/v9";
import type { GuildMember, Webhook } from "discord.js";
import type { DChannel, DForumChannel, DMessage, DUser } from "./types.js";

function channelToName(channel: Optional<DChannel | DForumChannel>): string | null {
	if (channel) {
		if ("guild" in channel) {
			const guildName = channel.guild?.name ?? channel.guildId ?? "UnknownGuild";
			const channelName = channel.name ?? channel.id;
			return `${guildName}#${ZERO_WIDTH_SPACE}${channelName}`;
		}
		if (channel.recipient) {
			return userToMention(channel.recipient);
		}
		return `#${ZERO_WIDTH_SPACE}${channel.id}`;
	}
	return null;
}

function messageToChannelName(message: DMessage): string {
	const author = userToMention(message.author);
	if (message.guild) {
		return channelToName(message.channel) + author;
	}else {
		return author;
	}
}

function userToMention(user: Optional<DUser | APIUser>): string {
	if (user) {
		if ("displayName" in user && user.displayName) {
			return `@${ZERO_WIDTH_SPACE}${user.displayName}`;
		}
		const discriminator = (user.discriminator ?? "0") !== "0" ? `#${user.discriminator}` : ``;
		return `@${ZERO_WIDTH_SPACE}${user.username}${discriminator}`;
	}
	return "@UnknownUser";
}

function memberToMention(member: Optional<GuildMember>): string {
	if (member) {
		if (member.nickname) {
			return `@${ZERO_WIDTH_SPACE}${member.nickname}`;
		}
		return userToMention(member.user);
	}
	return "@UnknownMember";
}

function webhookToName(webhook: Optional<Webhook>): string {
	if (webhook) {
		if (webhook.sourceGuild) {
			return `${webhook.sourceGuild.name}$${webhook.name}`;
		}
		if (webhook.owner) {
			return `${userToMention(webhook.owner)}$${webhook.name}`;
		}
		return `$${webhook.name}`;
	}
	return "$UnknownWebhook";
}

type Target = DChannel | DForumChannel | DMessage | DUser | GuildMember | Webhook;

/**
 * Returns a string that represents the Discord object in a meaningful way.
 * Users become @UserName.
 * Channels become #channel-name
 */
export function toHumanReadable<T extends Target>(target: T): string;
export function toHumanReadable<T extends Target>(target: Optional<T>): string | null;
export function toHumanReadable<T extends Target>(target: Optional<T>): string | null {
	if (target) {
		if ("token" in target) {
			return webhookToName(target);
		}
		if ("createDM" in target) {
			if ("user" in target) {
				return memberToMention(target);
			}else {
				return userToMention(target);
			}
		}
		if ("channel" in target) {
			return messageToChannelName(target);
		}
		return channelToName(target as DChannel);
	}
	return null;
}