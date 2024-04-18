import type { ChannelPermissionString } from "./ChannelPermissionString.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

/** Gets the set of permissions Sage needs for the channel. */
export function getRequiredChannelPerms(): ChannelPermissionString[] {
	return [
		"VIEW_CHANNEL",
		"MANAGE_MESSAGES",
		"MANAGE_WEBHOOKS",
		"READ_MESSAGE_HISTORY",
		"SEND_MESSAGES",
		"SEND_MESSAGES_IN_THREADS",
		"ADD_REACTIONS",
		"USE_EXTERNAL_EMOJIS"
	];
}
