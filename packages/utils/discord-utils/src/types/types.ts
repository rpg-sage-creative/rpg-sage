import type { AnySelectMenuInteraction, AnyThreadChannel, APIUser, AutocompleteInteraction, ButtonInteraction, CacheType, CategoryChannel, Channel, CommandInteraction, DMChannel, ForumChannel, MediaChannel, Message, MessageComponentInteraction, MessageReaction, MessageReference, ModalSubmitInteraction, NonThreadGuildBasedChannel, PartialDMChannel, PartialGroupDMChannel, Partialize, PartialMessage, PartialMessageReaction, PartialRecipient, PartialUser, User } from "discord.js";

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
