import type { Optional } from "@rsc-utils/core-utils";
import { ZERO_WIDTH_SPACE } from "@rsc-utils/string-utils";
import type { APIUser, Channel, Guild, GuildMember, GuildPreview, Message, PartialRecipient, PartialUser, User, Webhook } from "discord.js";
import { isDMBased, isGroupDMBased } from "./typeChecks.js";

function channelToName(channel: Optional<Channel>): string | undefined {
	if (channel) {
		if (isDMBased(channel)) {
			if (isGroupDMBased(channel)) {
				return channel.recipients.map(userToMention).join(",");
			}
			return userToMention(channel.recipient);
		}
		const guildName = guildToName(channel.guild);
		const channelName = channel.name ?? channel.id;
		return `${guildName}#${ZERO_WIDTH_SPACE}${channelName}`;
}
	return undefined;
}

function messageToChannelName(message: Message): string {
	const author = userToMention(message.author);
	if (message.guild) {
		return channelToName(message.channel) + author;
	}else {
		return author;
	}
}

type UserResolvable = User | PartialUser | APIUser | PartialRecipient;
function userToMention(user: Optional<UserResolvable>): string {
	if (user) {
		if ("displayName" in user && user.displayName) {
			return `@${ZERO_WIDTH_SPACE}${user.displayName}`;
		}
		if ("discriminator" in user) {
			const discriminator = (user.discriminator ?? "0") !== "0" ? `#${user.discriminator}` : ``;
			return `@${ZERO_WIDTH_SPACE}${user.username}${discriminator}`;
		}
		return `@${ZERO_WIDTH_SPACE}${user.username}`;
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

type GuildResolvable = Guild | GuildPreview;
function guildToName(guild: Optional<GuildResolvable>): string {
	return guild?.name ?? "UnknownGuild";
}

type Target = Channel | Guild | GuildPreview | GuildMember | Message | PartialUser | User | Webhook;

/**
 * Returns a string that represents the Discord object in a meaningful way.
 * Users become @UserName.
 * Channels become #channel-name
 */
export function toHumanReadable<T extends Target>(target: T): string;
export function toHumanReadable<T extends Target>(target: Optional<T>): string | undefined;
export function toHumanReadable<T extends Target>(target: Optional<T>): string | undefined {
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
		if ("discoverySplash" in target) {
			return guildToName(target);
		}
		return channelToName(target);
	}
	return undefined;
}