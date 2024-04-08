import type { GuildMember, TextChannel } from "discord.js";
import { getRequiredChannelPerms } from "./getRequiredChannelPerms.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

/** Checks the given channel to see what perms are missing. */
export async function getMissingChannelPerms(botGuildMember: GuildMember, channel: TextChannel): Promise<string[]> {
	const botPerms = botGuildMember.permissionsIn(channel);
	const requiredPairs = getRequiredChannelPerms();
	const missingPairs = requiredPairs.filter(pair => !botPerms.has(pair.perm));
	return missingPairs.map(pair => pair.label);
}
