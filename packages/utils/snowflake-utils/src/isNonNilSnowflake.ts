import type { Optional } from "@rsc-utils/type-utils";
import { isNilSnowflake } from "./isNilSnowflake.js";
import { isSnowflake } from "./isSnowflake.js";
import type { Snowflake } from "./types.js";

/** Returns true if the value is a valid non-nil Snowflake. */
export function isNonNilSnowflake(value: Optional<Snowflake>): value is Snowflake {
	return isSnowflake(value) && !isNilSnowflake(value);
}
