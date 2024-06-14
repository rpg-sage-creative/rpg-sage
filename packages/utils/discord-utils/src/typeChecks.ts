import type { Optional } from "@rsc-utils/core-utils";
import type { AnyThreadChannel, Channel, GuildBasedChannel, MessageTarget, PartialGroupDMChannel, PartialUser, User } from "discord.js";
import type { DMBasedChannel, UserOrPartial, WebhookChannel } from "./types.js";

type ChannelOrUser = Channel | UserOrPartial;

export function canCheckPermissionsFor(value: Optional<ChannelOrUser>): value is GuildBasedChannel {
	return isChannel(value) && "permissionsFor" in value;
}

export function canFetchWebhooksFor(value: Optional<ChannelOrUser>): value is WebhookChannel {
	return isChannel(value) && "fetchWebhooks" in value;
}

export function isChannel(value: Optional<ChannelOrUser>): value is Channel {
	return value ? "isThread" in value : false;
}

export function isMessageTarget(value: Optional<ChannelOrUser | MessageTarget>): value is MessageTarget {
	return value ? "send" in value : false;
}

export function isDMBased(value: Optional<ChannelOrUser>): value is DMBasedChannel {
	return isChannel(value) && value.isDMBased();
}

export function isGroupDMBased(value: Optional<ChannelOrUser>): value is PartialGroupDMChannel {
	return isDMBased(value) && "recipients" in value;
}

export function isGuildBased(value: Optional<ChannelOrUser>): value is GuildBasedChannel {
	return isChannel(value) && "guild" in value;
}

export function isThread(value: Optional<ChannelOrUser>): value is AnyThreadChannel {
	return isChannel(value) && value.isThread();
}

export function isUser(value: Optional<ChannelOrUser>): value is User | PartialUser {
	return value ? "createDM" in value : false;
}
