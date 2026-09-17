import { error } from "@rsc-utils/core-utils";
import type { GuildMember } from "discord.js";
import type { SupportedCategoryChannel, SupportedGameChannel } from "../types/index.js";
import { getPermsFor } from "./getPermsFor.js";

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
export async function blockFromChannel(sage: GuildMember, channel: SupportedGameChannel | SupportedCategoryChannel, memberToBlock: GuildMember): Promise<BlockResults> {
	const perms = getPermsFor(channel, sage);

	// see if we can manage the channel
	const canManageChannel = perms.can("ManageChannels");
	const canViewChannel = perms.can("ViewChannel");

	// check the state before we do any work
	const blockedBefore = !getPermsFor(channel, memberToBlock).can("ViewChannel");

	// if we can't manage or we don't need to, return now
	if (!canManageChannel || !canViewChannel || blockedBefore) {
		return { canManageChannel, canViewChannel, blockCorrect:blockedBefore };
	}

	// prepare perms
	const overwrites = { "ViewChannel":false };

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
	const blockedAfter = !getPermsFor(updatedChannel ?? channel, memberToBlock).can("ViewChannel");

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