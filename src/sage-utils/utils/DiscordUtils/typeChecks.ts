import type { Optional } from "../..";
import type { DChannel, DGuildChannel, DTextChannel, DUser, DWebhookChannel } from "./types";

export function canCheckPermissionsFor(channel: Optional<DUser>): false;
export function canCheckPermissionsFor(channel: Optional<DChannel>): channel is DGuildChannel;
export function canCheckPermissionsFor(channel: Optional<DWebhookChannel>): channel is DWebhookChannel;
export function canCheckPermissionsFor(channel: Optional<DChannel | DWebhookChannel | DUser>): channel is DWebhookChannel;
export function canCheckPermissionsFor(channel: Optional<DChannel | DWebhookChannel | DUser>): boolean {
	return channel ? "permissionsFor" in channel : false;
}

export function canFetchWebhooksFor(channel: Optional<DUser>): false;
export function canFetchWebhooksFor(channel: Optional<DChannel>): channel is DTextChannel;
export function canFetchWebhooksFor(channel: Optional<DWebhookChannel>): channel is DWebhookChannel;
export function canFetchWebhooksFor(channel: Optional<DChannel | DWebhookChannel | DUser>): channel is DWebhookChannel;
export function canFetchWebhooksFor(channel: Optional<DChannel | DWebhookChannel | DUser>): channel is DWebhookChannel {
	return channel ? "fetchWebhooks" in channel : false;
}
