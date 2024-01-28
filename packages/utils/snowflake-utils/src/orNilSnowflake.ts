import type { Optional } from "@rsc-utils/type-utils";
import { isNilSnowflake } from "./isNilSnowflake.js";
import { isSnowflake } from "./isSnowflake.js";
import { NIL_SNOWFLAKE, type Snowflake } from "./types.js";

/** Returns the value if it is a valid Snowflake, otherwise it returns NIL_SNOWFLAKE. */
export function orNilSnowflake(value: Optional<Snowflake>): Snowflake {
	return isSnowflake(value) && !isNilSnowflake(value) ? value : NIL_SNOWFLAKE;
}
