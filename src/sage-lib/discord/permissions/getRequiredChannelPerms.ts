import type { PermissionFlagsBits } from "discord.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

type PermFlagBitsKeys = keyof typeof PermissionFlagsBits;

/** Gets the set of permissions Sage needs for the channel. */
export function getRequiredChannelPerms(): PermFlagBitsKeys[] {
	return [
		"ViewChannel",
		"ManageMessages",
		"ManageWebhooks",
		"ReadMessageHistory",
		"SendMessages",
		"SendMessagesInThreads",
		"AddReactions",
		"UseExternalEmojis",
	];
}
