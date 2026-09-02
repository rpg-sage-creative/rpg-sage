import type { Optional } from "@rsc-utils/core-utils";
import { toHumanReadable } from "@rsc-utils/discord-utils";
import type { SageCommand } from "../../../model/SageCommand.js";

export async function toReadableOwner(sageCommand: SageCommand, userId: Optional<string>): Promise<string | null> {
	if (userId) {
		const guildMember = await sageCommand.discord.fetchGuildMember(userId);
		if (guildMember) return toHumanReadable(guildMember);
		const user = await sageCommand.discord.fetchUser(userId);
		if (user) return toHumanReadable(user);
	}
	return null;
}