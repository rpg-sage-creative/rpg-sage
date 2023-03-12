import type { Optional } from "../..";
import type { DChannel, DMessage, DUser } from "./types";

function channelToName(channel: DChannel): string;
function channelToName(channel: Optional<DChannel>): string | null;
function channelToName(channel: Optional<DChannel>, defaultName: string): string;
function channelToName(channel: Optional<DChannel>, defaultName?: string): string | null {
	if (channel) {
		if ("guild" in channel) {
			return `${channel.guild?.name ?? channel.guildId ?? "UnknownGuild"}#${channel.name ?? channel.id}`;
		}
		return `dm@${channel.recipient.username}#${channel.recipient.discriminator}`;
	}
	return defaultName ?? null;
}

function messageToChannelName(message: DMessage): string {
	const author = authorToMention(message.author);
	if (message.guild) {
		return `${channelToName(message.channel)}${author}`;
	}else {
		return `dm${author}`;
	}
}

function authorToMention(author: DUser): string;
function authorToMention(author: Optional<DUser>): string;
function authorToMention(author: Optional<DUser>): string {
	return author ? `@${author.username}#${author.discriminator}` : "@UnknownAuthor";
}

export function toHumanReadable(channel: DChannel): string;
export function toHumanReadable(channel: Optional<DChannel>): string;
export function toHumanReadable(message: DMessage): string;
export function toHumanReadable(message: Optional<DMessage>): string;
export function toHumanReadable(user: DUser): string;
export function toHumanReadable(user: Optional<DUser>): string;
export function toHumanReadable(target: DChannel | DMessage | DUser): string;
export function toHumanReadable(target: Optional<DChannel | DMessage | DUser>): string | null;
export function toHumanReadable(target: Optional<DChannel | DMessage | DUser>): string | null {
	if (target) {
		if ("createDM" in target) {
			return authorToMention(target);
		}
		if ("channel" in target) {
			return messageToChannelName(target);
		}
		return channelToName(target);
	}
	return null;
}