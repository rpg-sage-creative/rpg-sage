import type { Optional } from "@rsc-utils/type-utils";
import { isMaxUuid } from "./uuid/isMaxUuid.js";
import { isNonNilUuid } from "./uuid/isNonNilUuid.js";
import { isNonNilSnowflake } from "./snowflake/isNonNilSnowflake.js";
import type { Snowflake } from "./snowflake/types.js";
import type { UUID } from "./uuid/types.js";

/** TypeGuard for valid Snowflake (non-nil) or UUID (non-nil, non-max). */
export function isValidId(id: Optional<string>): id is Snowflake | UUID {
	return typeof(id) === "string"
		? isNonNilSnowflake(id) || (isNonNilUuid(id) && !isMaxUuid(id))
		: false;
}