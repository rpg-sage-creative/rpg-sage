import type { Optional } from "@rsc-utils/core-utils";
import type { Role } from "discord.js";
import { addZeroWidthSpaces } from "./addZeroWidthSpaces.js";
import { toGuildName } from "./toGuildName.js";

export function toRoleName(role: Optional<Role>): string {
	if (role) {
		const guildName = toGuildName(role.guild);
		return addZeroWidthSpaces(`${guildName}@${role.name}`);
	}
	return "@UnknownRole";
}