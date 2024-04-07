import type { PermissionResolvable, TextChannel } from "discord.js";
import type { SageCommand } from "../../sage/model/SageCommand.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

/** Holds the Discord perm and the human readable label. */
type BotPermPairs = { perm:PermissionResolvable; label:string; };

/** Gets the set of permissions Sage needs for the channel. */
function getRequiredChannelPerms(): BotPermPairs[] {
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

/** Checks the given channel to see what perms are missing. */
export async function getMissingChannelPerms(sageCommand: SageCommand, channel?: TextChannel | null): Promise<string[]> {
	const bot = await sageCommand.sageCache.discord.fetchGuildMember(sageCommand.bot.did);
	if (bot && channel) {
		const botPerms = bot.permissionsIn(channel);botPerms.has("MANAGE_CHANNELS")
		const requiredPairs = getRequiredChannelPerms();
		const missingPairs = requiredPairs.filter(pair => !botPerms.has(pair.perm));
		return missingPairs.map(pair => pair.label);
	}
	return [];
}
