import type { Snowflake } from "@rsc-utils/id-utils";
import type { Optional } from "@rsc-utils/type-utils";
import { getIds } from "./getIds.js";

/** Retrieves the id from env for "superAdminIds" and checks to see if it includes the given id. */
export function isSuperAdminId(id: Optional<string>): id is Snowflake {
	return id
		? getIds("superAdmin", true).includes(id as Snowflake)
		: false;
}