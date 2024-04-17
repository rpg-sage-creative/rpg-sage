import type { GuildMember, TextChannel } from "discord.js";
import { type BotPermPairs, getRequiredChannelPerms } from "./getRequiredChannelPerms.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

type FixPermResults = {
	/** Could Sage manage the channel? */
	canManageChannel: boolean;

	/** perms missing before the edit */
	missingBefore?: BotPermPairs[];

	/** was an edit attempted? */
	fixAttempted?: boolean;

	/** perms missing after the edit */
	missingAfter?: BotPermPairs[];

	/** was there a successful edit? */
	fixSuccess?: boolean;

	/** regardless of changes, are the final perms correct? */
	permsCorrect: boolean;
};

/** Checks the given channel to see what perms are missing. */
export async function fixMissingChannelPerms(botGuildMember: GuildMember, channel: TextChannel): Promise<FixPermResults> {
	// see if we can manage the channel
	const permsBefore = channel.permissionsFor(botGuildMember);
	const canManageChannel = permsBefore.has("MANAGE_CHANNELS");

	// check the state before we do any work
	const requiredPairs = getRequiredChannelPerms();
	const missingBefore = requiredPairs.filter(pair => !permsBefore.has(pair.perm));

	// if we can't manage or we don't need to, return now
	if (!canManageChannel || missingBefore.length === 0) {
		return { canManageChannel, permsCorrect:true };
	}

	// prepare perms
	const overwrites: { [key: string]: boolean; } = { };
	for (const pair of missingBefore) {
		overwrites[pair.perm] = true;
	}

	// update perms
	const updatedChannel = await channel.permissionOverwrites.create(botGuildMember, overwrites);

	// recheck perms
	const permsAfter = updatedChannel.permissionsFor(botGuildMember);
	const missingAfter = requiredPairs.filter(pair => !permsAfter.has(pair.perm));

	return {
		canManageChannel,
		missingBefore,
		fixAttempted: true,
		missingAfter,
		fixSuccess: missingAfter.length === 0,
		permsCorrect: missingAfter.length === 0
	};
}
