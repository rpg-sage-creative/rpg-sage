import type { Optional } from "../types/generics.js";
import type { Snowflake } from "./types.js";

/** Returns true if the value is a valid non-nil Snowflake. */
export function isNonNilSnowflake(value: Optional<string>): value is Snowflake {
	if (value) {
		const regex = /^(?!0{16,})\d{16,}$/;
		return regex.test(value);
	}
	return false;
}
