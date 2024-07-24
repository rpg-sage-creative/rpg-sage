import { getId, type Snowflake } from "@rsc-utils/core-utils";

export function getSuperAdminId(): Snowflake {
	return getId("superAdmin");
}