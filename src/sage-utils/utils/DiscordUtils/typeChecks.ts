import type { Optional } from "../..";
import type { DChannel, DGuildChannel, DTextChannel, DUser } from "./types";

export function canCheckPermissionsFor(channel: Optional<DUser>): false;
export function canCheckPermissionsFor(channel: Optional<DChannel>): channel is DGuildChannel;
export function canCheckPermissionsFor(channel: Optional<DChannel | DUser>): channel is DGuildChannel;
export function canCheckPermissionsFor(channel: Optional<DChannel | DUser>): channel is DGuildChannel {
	return channel ? "permissionsFor" in channel : false;
}

export function canFetchWebhooksFor(channel: Optional<DChannel>): channel is DTextChannel {
	return channel ? "fetchWebhooks" in channel : false;
}
