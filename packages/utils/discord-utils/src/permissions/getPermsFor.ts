import { PermissionFlagsBits } from "discord-api-types/v9";
import type { GuildBasedChannel, GuildMember, GuildMemberResolvable, Role, RoleResolvable } from "discord.js";
import { canCheckPermissionsFor, canFetchWebhooksFor, isGuildBased } from "../typeChecks.js";
import type { DWebhookChannel } from "../types.js";
import type { ChannelPermissionString } from "./ChannelPermissionString.js";

type AccessResults = {
	/** perms.has("MANAGE_CHANNELS") */
	canManageChannel: boolean;

	/** perms.has("MANAGE_WEBHOOKS") */
	canManageWebhooks: boolean;

	/** perms.has("VIEW_CHANNEL") */
	canViewChannel: boolean;

	/** is the member in the members list (has joined a thread) */
	isInChannel: boolean;

	/** perms.has("SEND_MESSAGES") or perms.has("SEND_MESSAGES_IN_THREADS") */
	canSendMessages: boolean;

	/** perms.has("ADD_REACTIONS") */
	canAddReactions: boolean;

	/** canManageWebhooks and "fetchWebhooks" in channel */
	canSendWebhooks: boolean;

	/** Only returned if canSendWebhooks === true; the channel or thread parent that has webhooks */
	webhookChannel?: DWebhookChannel;
};

type CheckedResults = AccessResults & {
	/** the perms checked */
	checked: ChannelPermissionString[];

	/** missing.length > 0 */
	// hasMissing: boolean;

	/** presnt.length > 0 */
	// hasPresent: boolean;

	/** the perms not found */
	missing: ChannelPermissionString[];

	/** the perms found */
	present: ChannelPermissionString[];
};

type GuildMemberOrRoleResolvable = GuildMember | GuildMemberResolvable | Role | RoleResolvable;

/** A quick check to see if a member or role can view or manage a channel. */
export function getPermsFor(channel: GuildBasedChannel, memberOrRole: GuildMemberOrRoleResolvable): AccessResults;

/** Checks the user/role and channel to see which of the given permissions are missing or present. */
export function getPermsFor(channel: GuildBasedChannel, memberOrRole: GuildMemberOrRoleResolvable, ...permsToCheck: ChannelPermissionString[]): CheckedResults;

export function getPermsFor(channel: GuildBasedChannel, memberOrRole?: GuildMemberOrRoleResolvable, ...checked: ChannelPermissionString[]): AccessResults | CheckedResults {
	// resolve an object to an id; use SageId when we don't have a member or role
	const memberId = typeof(memberOrRole) === "string" ? memberOrRole : memberOrRole?.id;
	// return false if member or channel are not valid
	if (!memberId || !isGuildBased(channel)) {
		return { canManageChannel:false, canManageWebhooks:false, canViewChannel:false, isInChannel:false, canSendMessages:false, canAddReactions:false, canSendWebhooks:false };
	}

	// check for thread and ensure we have the correct channel for perms checking
	const isThread = channel.isThread();
	const channelWithPerms = isThread ? channel.parent : channel;
	if (!canCheckPermissionsFor(channelWithPerms)) {
		return { canManageChannel:false, canManageWebhooks:false, canViewChannel:false, isInChannel:false, canSendMessages:false, canAddReactions:false, canSendWebhooks:false };
	}

	const perms = channelWithPerms?.permissionsFor(memberId);
	const canManageChannel = perms?.has(PermissionFlagsBits.ManageChannels) ?? false;
	const canManageWebhooks = perms?.has(PermissionFlagsBits.ManageWebhooks) ?? false;
	const canViewChannel = perms?.has(PermissionFlagsBits.ViewChannel) ?? false;
	const isInChannel = isThread ? channel.guildMembers.has(memberId) : channel.members.has(memberId);
	const canSendMessages = perms?.has(isThread ? PermissionFlagsBits.SendMessagesInThreads : PermissionFlagsBits.SendMessages) ?? false;
	const canAddReactions = perms?.has(PermissionFlagsBits.AddReactions) ?? false;
	const canSendWebhooks = canManageWebhooks && canFetchWebhooksFor(channelWithPerms);
	const webhookChannel = canSendWebhooks ? channelWithPerms : undefined;

	if (arguments.length < 3) {
		return { canManageChannel, canManageWebhooks, canViewChannel, isInChannel, canSendMessages, canAddReactions, canSendWebhooks, webhookChannel };
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
		checked,
		missing,
		// hasMissing,
		present,
		// hasPresent,
	};
}