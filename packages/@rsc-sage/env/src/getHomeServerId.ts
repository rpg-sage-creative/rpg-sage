import type { Snowflake } from "@rsc-utils/id-utils";
import { getId } from "./getId.js";

export function getHomeServerId(): Snowflake {
	return getId("homeServer");
}