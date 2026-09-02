import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import type { AdminRoleType } from "./AdminRoleType.js";
import { isSimpleObject } from "../../validation/index.js";

export type AdminUser = { did: Snowflake; role: AdminRoleType; }

export function isAdminUser(admin: unknown): admin is AdminUser {
	return isSimpleObject(admin)
		&& isNonNilSnowflake(admin.did)
		&& [0,1,2,3].includes(admin.role);
}