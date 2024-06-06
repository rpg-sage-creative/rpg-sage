import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { Optional } from "@rsc-utils/core-utils";
import type { SageMessage } from "../../../model/SageMessage";

export async function toReadableOwner(sageMessage: SageMessage, userId: Optional<string>): Promise<string | null> {
	if (userId) {
		const guildMember = await sageMessage.discord.fetchGuildMember(userId);
		if (guildMember) return toHumanReadable(guildMember);
		const user = await sageMessage.discord.fetchUser(userId);
		if (user) return toHumanReadable(user);
	}
	return null;
}