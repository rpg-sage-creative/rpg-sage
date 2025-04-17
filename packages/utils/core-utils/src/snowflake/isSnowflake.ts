import type { Optional } from "../types/generics.js";
import type { Snowflake } from "./types.js";

/** we use this regexp so much (for testing only), let's cache it */
let _regexp: RegExp;

/** Returns true if the value is a series of at least 16 numeric digits. */
export function isSnowflake(value: Optional<string>): value is Snowflake {
	if (value) {
		const regexp = _regexp ?? (_regexp = /^\d{16,}$/);
		return regexp.test(value);
	}
	return false;
}
