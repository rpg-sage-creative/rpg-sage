import { error } from "@rsc-utils/console-utils";
import type { Optional, OrNull } from "@rsc-utils/type-utils";
import type { Channel, Guild } from "discord.js";

function isTextChannel(channel: Optional<Channel>): boolean {
	if (channel) {
		if ("isText" in channel && typeof(channel.isText) === "function" && channel.isText()) {
			return true;
		}
		if ("isTextBased" in channel && typeof(channel.isTextBased) === "function" && channel.isTextBased()) {
			return true;
		}
	}
	return false;
}

export function toInviteUrl(guild: Optional<Guild>): OrNull<string> {
	if (!guild) {
		return null;
	}
	try {
		const bestInvite = guild.invites.cache.find(invite => {
			if (("stageInstance" in invite) && invite.stageInstance) {
				return false;
			}
			if (invite.targetUser || invite.temporary) {
				return false;
			}
			return isTextChannel(invite.channel);
		});
		return bestInvite?.url ?? null;
	}catch(ex) {
		error(ex);
	}
	return null;
}