import { GuildMember } from "discord.js";
import type { Optional } from "../..";
import { ZERO_WIDTH_SPACE } from "./consts";
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

function userToMention(user: DUser): string;
function userToMention(user: Optional<DUser>): string;
function userToMention(user: Optional<DUser>): string {
	if (user) {
		if ("displayName" in user && user.displayName) {
			return `@${ZERO_WIDTH_SPACE}${user.displayName}`;
		}
		const discriminator = (user.discriminator ?? "0") !== "0" ? `#${user.discriminator}` : ``;
		return `@${ZERO_WIDTH_SPACE}${user.username}${discriminator}`;
	}
	return "@UnknownUser";
}

function memberToMention(member: GuildMember): string;
function memberToMention(member: Optional<GuildMember>): string;
function memberToMention(member: Optional<GuildMember>): string {
	if (member) {
		if (member.nickname) {
			return `@${ZERO_WIDTH_SPACE}${member.nickname}`;
		}
		return userToMention(member.user);
	}
	return "@UnknownMember";
}

export function toHumanReadable(channel: DChannel): string;
export function toHumanReadable(channel: Optional<DChannel>): string;
export function toHumanReadable(channel: DForumChannel): string;
export function toHumanReadable(channel: Optional<DForumChannel>): string;
export function toHumanReadable(message: DMessage): string;
export function toHumanReadable(message: Optional<DMessage>): string;
export function toHumanReadable(user: DUser): string;
export function toHumanReadable(user: Optional<DUser>): string;
export function toHumanReadable(member: GuildMember): string;
export function toHumanReadable(target: DChannel | DForumChannel | DMessage | DUser | GuildMember): string;
export function toHumanReadable(target: Optional<DChannel | DForumChannel | DMessage | DUser | GuildMember>): string | null;
export function toHumanReadable(target: Optional<DChannel | DForumChannel | DMessage | DUser | GuildMember>): string | null {
	if (target) {
		if ("createDM" in target) {
			if ("user" in target) {
				memberToMention(target);
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