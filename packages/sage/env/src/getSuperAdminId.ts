import { getId } from "@rsc-utils/core-utils";
import type { Snowflake } from "discord.js";

export function getSuperAdminId(): Snowflake {
	return getId("superAdmin");
}