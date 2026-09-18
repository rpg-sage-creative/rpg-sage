import type { Optional } from "@rsc-utils/type-utils";
import type { Snowflake } from "./types.js";

const NonNilSnowflake = /^(?!0{16,})\d{16,}$/;

/** Returns true if the value is a valid non-nil Snowflake. */
export function isNonNilSnowflake(value: Optional<string>): value is Snowflake {
	return typeof(value) === "string" && NonNilSnowflake.test(value);
}
