import { error } from "@rsc-utils/core-utils";
import type { GuildMember, PermissionFlagsBits } from "discord.js";
import type { SupportedCategoryChannel, SupportedGameChannel } from "../types/index.js";
import { getPermsFor } from "./getPermsFor.js";
import { getRequiredPermissions } from "./getRequiredPermissions.js";

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
export async function fixMissingChannelPerms(botGuildMember: GuildMember, channel: SupportedGameChannel | SupportedCategoryChannel): Promise<FixPermResults> {
	const runGamePerms = getRequiredPermissions("RunGame");

	// check the state before we do any work
	const before = getPermsFor(channel, botGuildMember, ...runGamePerms);
	const canManageChannel = before.can("ManageChannels");
	const canViewChannel = before.can("ViewChannel");

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
	const errorHandler = (log: boolean) => {
		if (log) {
			const fnName = "fixMissingChannelPerms";
			const fnSection = "permissionOverwrites";
			const channelType = channel.type;
			const parentChannelType = channel.parent?.type;
			error({ fnName, fnSection, channelType, parentChannelType });
		}
		fixError = true;
		return null;
	};
	const updatedChannel = "permissionOverwrites" in channel
		? await channel.permissionOverwrites.create(botGuildMember, overwrites).catch(() => errorHandler(false))
		: errorHandler(true);

	// recheck perms
	const after = getPermsFor(updatedChannel ?? channel, botGuildMember, ...runGamePerms);

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
