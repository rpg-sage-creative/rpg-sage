import type { Optional } from "@rsc-utils/type-utils";
import type { NIL_SNOWFLAKE } from "./types.js";

const NilSnowflakeRegExp = /^0{16,}$/;

/**
 * Returns true if the value is a series of at least 16 0s.
 * This accounts for possibly old data that incorrectly assumed a static length of a Snowflake and had a different length for NIL_SNOWFLAKE.
 */
export function isNilSnowflake(value: Optional<string>): value is NIL_SNOWFLAKE {
	return typeof(value) === "string" && NilSnowflakeRegExp.test(value);
}
