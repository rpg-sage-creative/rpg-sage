import type { Optional } from "@rsc-utils/type-utils";
import type { Snowflake } from "./types.js";

/** Returns true if the value is a series of at least 16 numeric digits. */
export function isSnowflake(value: Optional<Snowflake>): value is Snowflake {
	if (value) {
		const regex = /^\d{16,}$/;
		return regex.test(value);
	}
	return false;
}
