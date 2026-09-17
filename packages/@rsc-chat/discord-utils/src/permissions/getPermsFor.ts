import type { Optional } from "@rsc-utils/core-utils";
import { PermissionFlagsBits, PermissionsBitField, type Channel, type GuildMember, type GuildMemberResolvable, type Role, type RoleResolvable } from "discord.js";
import { resolveSnowflake } from "../resolve/resolveSnowflake.js";
import { isSupportedWebhookChannel, type SupportedWebhookChannel } from "../types/typeGuards/isSupported.js";

type PermissionsArgs = {
	checked?: PermFlagBitsKeys[];
	isInChannel?: boolean;
	isThread?: boolean;
	missing?: PermFlagBitsKeys[];
	perms?: Optional<PermissionsBitField>;
	present?: PermFlagBitsKeys[];
	webhookChannel?: Optional<SupportedWebhookChannel>;
};
class Permissions {
	/** the perms checked */
	public checked: PermFlagBitsKeys[];

	/** is the member in the members list (has joined a thread) */
	public isInChannel: boolean;

	/** is the channel actually a thread */
	public isThread: boolean;

	/** the perms not found */
	public missing: PermFlagBitsKeys[];

	/** the underlying permissions data */
	public perms?: PermissionsBitField;

	/** the perms found */
	public present: PermFlagBitsKeys[];

	/** the webhook channel (parent of a thread) */
	public webhookChannel?: SupportedWebhookChannel;

	public constructor({ checked, isInChannel, isThread, missing, perms, present, webhookChannel }: PermissionsArgs = { }) {
		this.checked = checked ?? [];
		this.isInChannel = isInChannel ?? false;
		this.isThread = isThread ?? false;
		this.missing = missing ?? [];
		this.perms = perms ?? undefined;
		this.present = present ?? [];
		this.webhookChannel = webhookChannel ?? undefined;
	}

	/** Tests to see if the requested permission is present */
	public can(key: "SendTo" | "WebhookTo" | keyof typeof PermissionFlagsBits): boolean {
		if (key === "SendTo") {
			return this.isThread ? this.can("SendMessagesInThreads") : this.can("SendMessages");
		}
		if (key === "WebhookTo") {
			return this.can("ManageWebhooks") && this.webhookChannel !== undefined;
		}
		return this.perms?.has(key) ?? false;
	}

	// public has(key: "checked" | "missing" | "present"): boolean {
	// 	return this[key].length > 0;
	// }
}

type PermFlagBitsKeys = keyof typeof PermissionFlagsBits;

type GuildMemberOrRoleResolvable = GuildMember | GuildMemberResolvable | Role | RoleResolvable;

/** A quick check to see if a member or role can view or manage a channel. */
export function getPermsFor(channel: Channel, memberOrRole: GuildMemberOrRoleResolvable): Permissions;

/** Checks the user/role and channel to see which of the given permissions are missing or present. */
export function getPermsFor(channel: Channel, memberOrRole: GuildMemberOrRoleResolvable, ...permsToCheck: PermFlagBitsKeys[]): Permissions;

export function getPermsFor(channel: Channel, memberOrRole?: GuildMemberOrRoleResolvable, ...checked: PermFlagBitsKeys[]): Permissions {
	const memberOrRoleId = resolveSnowflake(memberOrRole);

	// return false if member or channel are not valid
	if (!memberOrRoleId || !channel || channel.isDMBased()) {
		return new Permissions();
	}

	// check for thread and ensure we have the correct channel for perms checking
	const isThread = channel.isThread();
	const channelWithPerms = isThread ? channel.parent : channel;
	if (!channelWithPerms || channelWithPerms.isDMBased()) {
		return new Permissions();
	}

	const perms = channelWithPerms?.permissionsFor(memberOrRoleId);
	const isInChannel = isThread ? channel.guildMembers.has(memberOrRoleId) : channel.members.has(memberOrRoleId);
	const webhookChannel = isSupportedWebhookChannel(channelWithPerms) ? channelWithPerms : undefined;

	if (arguments.length < 3) {
		return new Permissions({ isInChannel, isThread, perms, webhookChannel });
	}

	const missing = perms ? checked.filter(perm => !perms.has(perm)) : checked.slice();
	const present = perms ? checked.filter(perm => perms.has(perm)) : [];
	return new Permissions({ checked, isInChannel, isThread, missing, perms, present, webhookChannel });
}