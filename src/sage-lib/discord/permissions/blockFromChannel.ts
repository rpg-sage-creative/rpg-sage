import { GuildMember, TextChannel } from "discord.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

type BlockResults = {
	/** Could Sage manage the channel? */
	canManageChannel: boolean;

	/** was member blocked before the edit */
	blockedBefore?: boolean;

	/** was an edit attempted? */
	fixAttempted?: boolean;

	/** is member blocked after the edit */
	blockedAfter?: boolean;

	/** was there a successful edit */
	fixSuccess?: boolean;

	/** regardless of changes, is the member blocked? */
	blockCorrect: boolean;
};

/** Blocks the given target from the given channel. */
export async function blockFromChannel(sageGuildMember: GuildMember, channel: TextChannel, memberToBlock: GuildMember): Promise<BlockResults> {
	// see if we can manage the channel
	const canManageChannel = channel.permissionsFor(sageGuildMember).has("MANAGE_CHANNELS");

	// check the state before we do any work
	const permsBefore = channel.permissionsFor(memberToBlock);
	const blockedBefore = !permsBefore.has("VIEW_CHANNEL");

	// if we can't manage or we don't need to, return now
	if (!canManageChannel || blockedBefore) {
		return { canManageChannel, blockCorrect:true };
	}

	// prepare perms
	const overwrites = { "VIEW_CHANNEL":false };

	// update perms
	const updatedChannel = await channel.permissionOverwrites.create(memberToBlock, overwrites);

	// recheck perms
	const permsAfter = updatedChannel.permissionsFor(memberToBlock);
	const blockedAfter = !permsAfter.has("VIEW_CHANNEL");

	return {
		canManageChannel,
		blockedBefore,
		fixAttempted: true,
		blockedAfter,
		fixSuccess: blockedAfter,
		blockCorrect: blockedAfter
	};
}