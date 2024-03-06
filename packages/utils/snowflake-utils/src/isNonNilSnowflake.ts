import type { Optional } from "@rsc-utils/type-utils";
import type { Snowflake } from "./types.js";

/** Returns true if the value is a valid non-nil Snowflake. */
export function isNonNilSnowflake(value: Optional<Snowflake>): value is Snowflake {
	if (value) {
		const regex = /^(?!0{16,})\d{16,}$/;
		return regex.test(value);
	}
	return false;
}
