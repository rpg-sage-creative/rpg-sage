import type { GuildMember, TextChannel } from "discord.js";
import { type BotPermPairs, getRequiredChannelPerms } from "./getRequiredChannelPerms.js";

/*
https://discord.com/developers/docs/topics/permissions
*/

type FixPermResults = {
	canManageChannel: boolean;
	attempted: boolean;
	missingBefore?: BotPermPairs[];
	missingAfter?: BotPermPairs[];
	success: boolean;
};

/** Checks the given channel to see what perms are missing. */
export async function fixMissingChannelPerms(botGuildMember: GuildMember, channel: TextChannel): Promise<FixPermResults> {
	const permsBefore = channel.permissionsFor(botGuildMember);
	const canManageChannel = permsBefore.has("MANAGE_CHANNELS");

	let attempted = false;
	let missingBefore: BotPermPairs[] | undefined;
	let missingAfter: BotPermPairs[] | undefined;
	let success = false;

	if (canManageChannel) {
		const requiredPairs = getRequiredChannelPerms();
		missingBefore = requiredPairs.filter(pair => !permsBefore.has(pair.perm));
		if (missingBefore.length) {
			attempted = true;

			const overwrites: { [key: string]: boolean; } = { };
			for (const pair of missingBefore) {
				overwrites[pair.perm] = true;
			}

			const updatedChannel = await channel.permissionOverwrites.create(botGuildMember, overwrites);
			const permsAfter = updatedChannel.permissionsFor(botGuildMember);
			missingAfter = requiredPairs.filter(pair => !permsAfter.has(pair.perm));
			success = missingAfter.length === 0;
		}
	}

	return {
		canManageChannel,
		attempted,
		missingBefore,
		missingAfter,
		success
	};
}
