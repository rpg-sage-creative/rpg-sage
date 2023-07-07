import type { Optional } from "..";
import type { DChannel, DForumChannel, DMessage, DUser } from "./types";

function channelToName(channel: DChannel): string;
function channelToName(channel: DForumChannel): string;
function channelToName(channel: Optional<DChannel>): string | null;
function channelToName(channel: Optional<DForumChannel>): string | null;
function channelToName(channel: Optional<DChannel | DForumChannel>): string | null {
	if (channel) {
		if ("guild" in channel) {
			const guildName = channel.guild?.name ?? channel.guildId ?? "UnknownGuild";
			const channelName = channel.name ?? channel.id;
			return `${guildName}#${channelName}`;
		}
		if (channel.recipient) {
			return userToMention(channel.recipient);
		}
		return `#${channel.id}`;
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

function userToMention(user: DUser): string;
function userToMention(user: Optional<DUser>): string;
function userToMention(user: Optional<DUser>): string {
	if (user) {
		const base = `@${user.username}`;
		const discriminator = (user.discriminator ?? "0") !== "0" ? `#${user.discriminator}` : ``;
		return base + discriminator;
	}
	return "@UnknownUser";
}

export function toHumanReadable(channel: DChannel): string;
export function toHumanReadable(channel: Optional<DChannel>): string;
export function toHumanReadable(channel: DForumChannel): string;
export function toHumanReadable(channel: Optional<DForumChannel>): string;
export function toHumanReadable(message: DMessage): string;
export function toHumanReadable(message: Optional<DMessage>): string;
export function toHumanReadable(user: DUser): string;
export function toHumanReadable(user: Optional<DUser>): string;
export function toHumanReadable(target: DChannel | DForumChannel | DMessage | DUser): string;
export function toHumanReadable(target: Optional<DChannel | DForumChannel | DMessage | DUser>): string | null;
export function toHumanReadable(target: Optional<DChannel | DForumChannel | DMessage | DUser>): string | null {
	if (target) {
		if ("createDM" in target) {
			return userToMention(target);
		}
		if ("channel" in target) {
			return messageToChannelName(target);
		}
		return channelToName(target as DChannel);
	}
	return null;
}