import { error, type Optional, type OrUndefined } from "@rsc-utils/core-utils";
import { Guild } from "discord.js";

export function toInviteUrl(guild: Optional<Guild>): OrUndefined<string> {
	if (!guild) {
		return undefined;
	}
	try {
		const bestInvite = guild.invites.cache.find(invite => {
			if (!invite.channel?.isTextBased()) return false; //NOSONAR
			if (invite.guildScheduledEvent) return false; //NOSONAR
			if (invite.maxAge) return false; //NOSONAR
			if (invite.maxUses) return false; //NOSONAR
			if (invite.stageInstance) return false; //NOSONAR
			if (invite.targetApplication) return false; //NOSONAR
			if (invite.targetUser) return false; //NOSONAR
			if (invite.targetType) return false; //NOSONAR
			if (invite.temporary) return false; //NOSONAR
			return true;
		});
		return bestInvite?.url ?? undefined;
	}catch(ex) {
		error(ex);
	}
	return undefined;
}