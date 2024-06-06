import { getId } from "@rsc-utils/core-utils";
import type { Snowflake } from "discord.js";

export function getRollemId(): Snowflake {
	return getId("rollem");
}