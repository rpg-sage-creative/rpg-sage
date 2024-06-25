import { getId, type Snowflake } from "@rsc-utils/core-utils";

export function getHomeServerId(): Snowflake {
	return getId("homeServer");
}