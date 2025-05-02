import type { Optional } from "@rsc-utils/core-utils";
import type { MessageReference, AnySelectMenuInteraction, AnyThreadChannel, APIUser, AutocompleteInteraction, ButtonInteraction, CacheType, CategoryChannel, Channel, CommandInteraction, DiscordAPIError, DMChannel, ForumChannel, GuildBasedChannel, Interaction, MediaChannel, Message, MessageComponentInteraction, MessageReaction, ModalSubmitInteraction, NonThreadGuildBasedChannel, PartialDMChannel, PartialGroupDMChannel, PartialMessage, PartialMessageReaction, PartialRecipient, PartialUser, User, Partialize } from "discord.js";
import type { DiscordApiError } from "../DiscordApiError";

//#region types

export type MessageReferenceOrPartial = MessageReference | Omit<MessageReference, "type">;

export type DInteraction<Cached extends CacheType = CacheType>
	= ButtonInteraction<Cached> // button
	| AnySelectMenuInteraction<Cached> // select
	// there are more select menu interactions now
	| MessageComponentInteraction<Cached> // button or select or text
	| AutocompleteInteraction<Cached> // autocomplete
	| CommandInteraction<Cached> // slash
	| ModalSubmitInteraction<Cached> // modal
	;

export type DRepliableInteraction<Cached extends CacheType = CacheType>
	= ButtonInteraction<Cached>
	| AnySelectMenuInteraction<Cached>
	// there are more select menu interactions now
	| MessageComponentInteraction<Cached>
	| CommandInteraction<Cached>
	| ModalSubmitInteraction<Cached>
	;

type ChannelOrUser = Channel | UserOrPartial;

export type DMBasedChannel = PartialGroupDMChannel | DMChannel | PartialDMChannel;

/** Channel you can send a message to. */
export type MessageChannel = Exclude<Channel, CategoryChannel | ForumChannel | MediaChannel | PartialGroupDMChannel>;

export type SMessage = Message & { channel:MessageChannel; };
export type SPartialMessage = Partialize<SMessage, 'type' | 'system' | 'pinned' | 'tts', 'content' | 'cleanContent' | 'author'>;

export type SMessageOrPartial = SMessage | SPartialMessage;
export type MessageOrPartial = Message | PartialMessage;

/** User or Channel you can send a message to. */
export type MessageTarget = User | MessageChannel;

export type NonThreadChannel = Exclude<Channel, AnyThreadChannel>;

export type ReactionOrPartial = MessageReaction | PartialMessageReaction;

/** User or PartialUser */
export type UserOrPartial = User | PartialUser;

export type UserResolvable = User | PartialUser | APIUser | PartialRecipient;

/** Channels that can have webhooks. */
export type WebhookChannel = Exclude<NonThreadGuildBasedChannel, CategoryChannel | ForumChannel | MediaChannel>;

//#endregion

//#region type checks

export function isChannel(value: Optional<ChannelOrUser>): value is Channel {
	return value ? "isThread" in value : false;
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

export function isMessage<T extends MessageOrPartial>(value: Optional<Channel | Interaction | T | User | DiscordAPIError | DiscordApiError>): value is T {
	return value ? "author" in value : false;
}

export function isMessageTarget(value: Optional<ChannelOrUser>): value is MessageTarget {
	return value ? "send" in value : false;
}

export function isNonThread(value: Optional<ChannelOrUser>): value is NonThreadChannel {
	return isChannel(value) && !value.isThread();
}

export function isThread(value: Optional<ChannelOrUser>): value is AnyThreadChannel {
	return isChannel(value) && value.isThread();
}

export function isUser(value: Optional<ChannelOrUser>): value is UserOrPartial {
	return value ? "createDM" in value : false;
}

export function isWebhookChannel(value: Optional<ChannelOrUser>): value is WebhookChannel {
	return isChannel(value) && "fetchWebhooks" in value;
}

//#endregion