import { error } from "@rsc-utils/console-utils";
import type { GuildMember, NonThreadGuildBasedChannel } from "discord.js";
import { getPermsFor } from "./getPermsFor";

/*
https://discord.com/developers/docs/topics/permissions
*/

type BlockResults = {
	/** Could Sage manage the channel? */
	canManageChannel: boolean;

	/** Could Sage see the channel? */
	canViewChannel: boolean;

	/** was member blocked before the edit */
	blockedBefore?: boolean;

	/** was an edit attempted? */
	fixAttempted?: boolean;

	/** was there a successful edit */
	fixSuccess?: boolean;

	/** is member blocked after the edit */
	blockedAfter?: boolean;

	/** regardless of changes, is the member blocked? */
	blockCorrect: boolean;
};

/** Blocks the given target from the given channel. */
export async function blockFromChannel(sage: GuildMember, channel: NonThreadGuildBasedChannel, memberToBlock: GuildMember): Promise<BlockResults> {
	// see if we can manage the channel
	const { canManageChannel, canViewChannel } = getPermsFor(channel, sage);

	// check the state before we do any work
	const blockedBefore = !getPermsFor(channel, memberToBlock).canViewChannel;

	// if we can't manage or we don't need to, return now
	if (!canManageChannel || !canViewChannel || blockedBefore) {
		return { canManageChannel, canViewChannel, blockCorrect:blockedBefore };
	}

	// prepare perms
	const overwrites = { "VIEW_CHANNEL":false };

	// update perms
	let fixError = false;
	const errorHandler = (log: boolean) => {
		if (log) {
			const fnName = "blockFromChannel";
			const fnSection = "permissionOverwrites";
			const channelType = channel.type;
			const parentChannelType = channel.parent?.type;
			error({ fnName, fnSection, channelType, parentChannelType });
		}
		fixError = true;
		return null;
	};
	const updatedChannel = "permissionOverwrites" in channel
		? await channel.permissionOverwrites.create(memberToBlock, overwrites).catch(() => errorHandler(false))
		: errorHandler(true);

	// recheck perms
	const blockedAfter = !getPermsFor(updatedChannel ?? channel, memberToBlock).canViewChannel;

	return {
		canManageChannel,
		canViewChannel,
		blockedBefore,
		fixAttempted: true,
		fixSuccess: !fixError,
		blockedAfter,
		blockCorrect: blockedAfter
	};
}