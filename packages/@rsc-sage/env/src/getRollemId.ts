import { getId, type Snowflake } from "@rsc-utils/core-utils";

export function getRollemId(): Snowflake {
	return getId("rollem");
}