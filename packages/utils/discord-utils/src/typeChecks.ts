import type { Optional } from "@rsc-utils/type-utils";
import type { GuildBasedChannel } from "discord.js";
import type { DChannel, DDMChannel, DGuildChannel, DTextChannel, DUser, DWebhookChannel } from "./types.js";

type DChannelOrUser = DChannel | DWebhookChannel | DUser;

export function canCheckPermissionsFor(user: Optional<DUser>): false;
export function canCheckPermissionsFor(channel: Optional<DChannel>): channel is DGuildChannel;
export function canCheckPermissionsFor(channel: Optional<DWebhookChannel>): channel is DWebhookChannel;
export function canCheckPermissionsFor(channel: Optional<DChannelOrUser>): channel is DWebhookChannel;
export function canCheckPermissionsFor(channel: Optional<DChannelOrUser>): boolean {
	return channel ? "permissionsFor" in channel : false;
}

export function canFetchWebhooksFor(user: Optional<DUser>): false;
export function canFetchWebhooksFor(channel: Optional<DChannel>): channel is DTextChannel;
export function canFetchWebhooksFor(channel: Optional<DWebhookChannel>): channel is DWebhookChannel;
export function canFetchWebhooksFor(channel: Optional<DChannelOrUser>): channel is DWebhookChannel;
export function canFetchWebhooksFor(channel: Optional<DChannelOrUser>): boolean {
	return channel ? "fetchWebhooks" in channel : false;
}

export function isDMBased(user: Optional<DUser>): false;
export function isDMBased(channel: Optional<DChannel>): channel is DDMChannel;
export function isDMBased(channel: Optional<DWebhookChannel>): false;
export function isDMBased(channel: Optional<DChannelOrUser>): channel is DDMChannel;
export function isDMBased(channel: Optional<DChannelOrUser>): boolean {
	return channel ? ("recipient" in channel) || ("recipients" in channel) : false;
}

export function isGuildBased(channel: Optional<DChannel | GuildBasedChannel>): channel is DGuildChannel {
	const types = ["GUILD_TEXT", "GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_FORUM"];
	return types.includes(channel?.type!);
}