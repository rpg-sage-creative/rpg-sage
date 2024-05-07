import type { PermissionString } from "discord.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

/** The set of permission strings we are currently using. */
type SageChannelPermissionString = "VIEW_CHANNEL"
	| "MANAGE_MESSAGES"
	| "MANAGE_WEBHOOKS"
	| "READ_MESSAGE_HISTORY"
	| "SEND_MESSAGES"
	| "SEND_MESSAGES_IN_THREADS"
	| "ADD_REACTIONS"
	| "USE_EXTERNAL_EMOJIS";

/** A composite type that uses the correct valid strings but narrows it down for our usage. */
export type ChannelPermissionString = PermissionString & SageChannelPermissionString;
