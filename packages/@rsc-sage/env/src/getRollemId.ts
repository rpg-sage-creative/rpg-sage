import type { Snowflake } from "@rsc-utils/id-utils";
import { getId } from "./getId.js";

export function getRollemId(): Snowflake {
	return getId("rollem");
}