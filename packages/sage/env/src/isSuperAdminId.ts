import { getIds, type Optional, type Snowflake } from "@rsc-utils/core-utils";

/** Retrieves the id from env for "superAdminIds" and checks to see if it includes the given id. */
export function isSuperAdminId(id: Optional<Snowflake>): id is Snowflake {
	return id ? getIds("superAdmin", true).includes(id) : false;
}