import { isWholeNumberString, type Optional } from "@rsc-utils/type-utils";
import type { Snowflake } from "./types.js";

/** Returns true if the value is a series of at least 16 numeric digits. */
export function isSnowflake(value: Optional<string>): value is Snowflake {
	return isWholeNumberString(value) && value.length >= 16;
}
