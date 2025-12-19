import { getIds, type Snowflake } from "@rsc-utils/core-utils";

export function getSuperAdminIds(): Snowflake[] {
	return getIds("superAdmin");
}