import { getId, type Snowflake } from "@rsc-utils/core-utils";

export function getTupperBoxId(): Snowflake {
	return getId("tupperBox");
}