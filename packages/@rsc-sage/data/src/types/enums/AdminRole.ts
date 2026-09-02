import { isNonNilSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import type { AdminRoleType } from "./AdminRoleType.js";
import { isSimpleObject } from "../../validation/index.js";

export type AdminRole = { did: Snowflake; type: AdminRoleType; }

export function isAdminRole(role: unknown): role is AdminRole {
	return isSimpleObject(role)
		&& isNonNilSnowflake(role.did)
		&& [0,1,2,3].includes(role.type);
}