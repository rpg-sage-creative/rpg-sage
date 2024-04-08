import type { PermissionString } from "discord.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

/** Holds the Discord perm and the human readable label. */
export type BotPermPairs = { perm:PermissionString; label:string; };

/** Gets the set of permissions Sage needs for the channel. */
export function getRequiredChannelPerms(): BotPermPairs[] {
	return [
		{ perm:"VIEW_CHANNEL", label:"ViewChannel" },
		{ perm:"MANAGE_MESSAGES", label:"ManageMessages" },
		{ perm:"MANAGE_WEBHOOKS", label:"ManageWebhooks" },
		{ perm:"READ_MESSAGE_HISTORY", label:"ReadMessageHistory" },
		{ perm:"SEND_MESSAGES", label:"SendMessages" },
		{ perm:"SEND_MESSAGES_IN_THREADS", label:"SendMessagesInThreads" },
		{ perm:"ADD_REACTIONS", label:"AddReactions" },
		{ perm:"USE_EXTERNAL_EMOJIS", label:"UserExternalEmojis" },
	];
}
