import type { APIUser, Message, MessageReaction, MessageReference, Partialize, PartialMessage, PartialMessageReaction, PartialRecipient, PartialUser, User } from "discord.js";
import type { SupportedMessagesChannel } from "./typeGuards/isSupported.js";

export type MessageReferenceOrPartial = MessageReference | Omit<MessageReference, "type">;

export type SMessage = Message & { channel:SupportedMessagesChannel; };
export type SPartialMessage = Partialize<SMessage, 'type' | 'system' | 'pinned' | 'tts', 'content' | 'cleanContent' | 'author'>;

export type SMessageOrPartial = SMessage | SPartialMessage;
export type MessageOrPartial = Message | PartialMessage;

export type ReactionOrPartial = MessageReaction | PartialMessageReaction;

/** User or PartialUser */
export type UserOrPartial = User | PartialUser;

export type UserResolvable = User | PartialUser | APIUser | PartialRecipient;

//#endregion




