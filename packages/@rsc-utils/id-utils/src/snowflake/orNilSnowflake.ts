import type { Optional } from "@rsc-utils/type-utils";
import { isNonNilSnowflake } from "./isNonNilSnowflake.js";
import { NIL_SNOWFLAKE, type Snowflake } from "./types.js";

/** Returns the value if it is a valid Snowflake, otherwise it returns NIL_SNOWFLAKE. */
export function orNilSnowflake(value: Optional<string>): Snowflake {
	return isNonNilSnowflake(value) ? value : NIL_SNOWFLAKE;
}
