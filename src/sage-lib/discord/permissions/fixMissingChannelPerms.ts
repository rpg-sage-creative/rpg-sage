import type { GuildMember, PermissionFlagsBits, TextChannel } from "discord.js";
import { getPermsFor } from "./getPermsFor.js";
import { getRequiredChannelPerms } from "./getRequiredChannelPerms.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

type PermFlagBitsKeys = keyof typeof PermissionFlagsBits;

type FixPermResults = {
	/** Could Sage manage the channel? */
	canManageChannel: boolean;

	/** Could Sage see the channel? */
	canViewChannel: boolean;

	/** perms missing before the edit */
	missingBefore?: PermFlagBitsKeys[];

	/** was an edit attempted? */
	fixAttempted?: boolean;

	/** was there a successful edit? */
	fixSuccess?: boolean;

	/** perms missing after the edit */
	missingAfter?: PermFlagBitsKeys[];

	/** regardless of changes, are the final perms correct? */
	permsCorrect: boolean;
};

/** Checks the given channel to see what perms are missing. */
export async function fixMissingChannelPerms(botGuildMember: GuildMember, channel: TextChannel): Promise<FixPermResults> {
	// check the state before we do any work
	const before = getPermsFor(channel, botGuildMember, ...getRequiredChannelPerms());
	const { canManageChannel, canViewChannel } = before;

	// if we can't manage or we don't need to, return now
	if (!canManageChannel || !canViewChannel || before.missing.length) {
		return { canManageChannel, canViewChannel, permsCorrect:!before.missing.length };
	}

	// prepare perms
	const overwrites: { [key: string]: boolean; } = { };
	for (const perm of before.missing) {
		overwrites[perm] = true;
	}

	// update perms
	let fixError = false;
	const updatedChannel = await channel.permissionOverwrites.create(botGuildMember, overwrites)
		.catch(() => { fixError = true; return null; }); // NOSONAR

	// recheck perms
	const after = getPermsFor(updatedChannel ?? channel, botGuildMember, ...getRequiredChannelPerms());

	return {
		canManageChannel,
		canViewChannel,
		missingBefore: before.missing,
		fixAttempted: true,
		fixSuccess: !fixError,
		missingAfter: after.missing,
		permsCorrect: !after.missing.length
	};
}
