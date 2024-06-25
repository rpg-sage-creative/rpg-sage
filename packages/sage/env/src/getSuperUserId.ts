import { getId, type Snowflake } from "@rsc-utils/core-utils";

export function getSuperUserId(): Snowflake {
	return getId("superUser");
}