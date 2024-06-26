import { PermissionFlagsBits, type Channel, type GuildMember, type GuildMemberResolvable, type Role, type RoleResolvable } from "discord.js";
import { resolveSnowflake } from "../resolve/resolveSnowflake.js";
import { isGuildBased, isThread as isThreadChannel, isWebhookChannel, type WebhookChannel } from "../types/types.js";

type AccessResults = {
	/** perms.has("ManageChannels") */
	canManageChannel: boolean;

	/** perms.has("ManageWebhooks") */
	canManageWebhooks: boolean;

	/** perms.has("ViewChannel") */
	canViewChannel: boolean;

	/** is the member in the members list (has joined a thread) */
	isInChannel: boolean;

	/** perms.has("SendMessages") or perms.has("SendMessagesInThreads") */
	canSendMessages: boolean;

	/** perms.has("AddReactions") */
	canAddReactions: boolean;

	/** canManageWebhooks and "fetchWebhooks" in channel */
	canSendWebhooks: boolean;

	/** Only returned if canSendWebhooks === true; the channel or thread parent that has webhooks */
	webhookChannel?: WebhookChannel;

	canSendPolls: boolean;
};

function emptyResults(): AccessResults {
	return {
		canManageChannel: false,
		canManageWebhooks: false,
		canViewChannel: false,
		isInChannel: false,
		canSendMessages: false,
		canAddReactions: false,
		canSendWebhooks: false,
		canSendPolls: false
	};
}

type PermFlagBitsKeys = keyof typeof PermissionFlagsBits;

type CheckedResults = AccessResults & {
	/** the perms checked */
	checked: PermFlagBitsKeys[];

	/** missing.length > 0 */
	// hasMissing: boolean;

	/** presnt.length > 0 */
	// hasPresent: boolean;

	/** the perms not found */
	missing: PermFlagBitsKeys[];

	/** the perms found */
	present: PermFlagBitsKeys[];
};

type GuildMemberOrRoleResolvable = GuildMember | GuildMemberResolvable | Role | RoleResolvable;

/** A quick check to see if a member or role can view or manage a channel. */
export function getPermsFor(channel: Channel, memberOrRole: GuildMemberOrRoleResolvable): AccessResults;

/** Checks the user/role and channel to see which of the given permissions are missing or present. */
export function getPermsFor(channel: Channel, memberOrRole: GuildMemberOrRoleResolvable, ...permsToCheck: PermFlagBitsKeys[]): CheckedResults;

export function getPermsFor(channel: Channel, memberOrRole?: GuildMemberOrRoleResolvable, ...checked: PermFlagBitsKeys[]): AccessResults | CheckedResults {
	const memberOrRoleId = resolveSnowflake(memberOrRole);

	// return false if member or channel are not valid
	if (!memberOrRoleId || !isGuildBased(channel)) {
		return emptyResults();
	}

	// check for thread and ensure we have the correct channel for perms checking
	const isThread = isThreadChannel(channel);
	const channelWithPerms = isThread ? channel.parent : channel;
	if (!isGuildBased(channelWithPerms)) {
		return emptyResults();
	}

	const perms = channelWithPerms?.permissionsFor(memberOrRoleId);
	const canManageChannel = perms?.has(PermissionFlagsBits.ManageChannels) ?? false;
	const canManageWebhooks = perms?.has(PermissionFlagsBits.ManageWebhooks) ?? false;
	const canViewChannel = perms?.has(PermissionFlagsBits.ViewChannel) ?? false;
	const isInChannel = isThread ? channel.guildMembers.has(memberOrRoleId) : channel.members.has(memberOrRoleId);
	const canSendMessages = perms?.has(isThread ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages) ?? false;
	const canAddReactions = perms?.has(PermissionFlagsBits.AddReactions) ?? false;
	const canSendWebhooks = canManageWebhooks && isWebhookChannel(channelWithPerms);
	const webhookChannel = canSendWebhooks ? channelWithPerms : undefined;
	const canSendPolls = perms?.has(PermissionFlagsBits.SendPolls) ?? false;

	if (arguments.length < 3) {
		return { canManageChannel, canManageWebhooks, canViewChannel, isInChannel, canSendMessages, canAddReactions, canSendWebhooks, webhookChannel, canSendPolls };
	}

	const missing = perms ? checked.filter(perm => !perms.has(perm)) : checked.slice();
	// const hasMissing = missing.length > 0;
	const present = perms ? checked.filter(perm => perms.has(perm)) : [];
	// const hasPresent = present.length > 0;
	return {
		canManageChannel,
		canManageWebhooks,
		canViewChannel,
		isInChannel,
		canSendMessages,
		canAddReactions,
		canSendWebhooks,
		webhookChannel,
		canSendPolls,
		checked,
		missing,
		// hasMissing,
		present,
		// hasPresent,
	};
}