import { getId, type Optional, type Snowflake } from "@rsc-utils/core-utils";

/** Retrieves the id from env for "superUserId". */
export function getSuperUserId(): Snowflake {
	return getId("superUser");
}

/** Retrieves the id from env for "superUserId" and compares it to the given id. */
export function isSuperUserId(id: Optional<string>): id is Snowflake {
	return getId("superUser") === id;
}