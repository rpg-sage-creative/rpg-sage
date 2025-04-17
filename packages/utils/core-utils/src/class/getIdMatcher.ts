import { isSnowflake } from "../snowflake/isSnowflake.js";
import { SnowflakeMatcher } from "../snowflake/SnowflakeMatcher.js";
import type { Optional } from "../types/generics.js";
import type { Matcher } from "../types/Matcher.js";
import { isUuid } from "../uuid/isUuid.js";
import { UuidMatcher } from "../uuid/UuidMatcher.js";

/**
 * Used to create a matcher for an ID.
 * Creates a matcher that always returns false if the given ID isn't a snowflake or uuid.
 */
export function getIdMatcher(value: Optional<string>): Matcher {
	if (value) {
		if (isSnowflake(value)) {
			return new SnowflakeMatcher(value);
		}
		if (isUuid(value)) {
			return new UuidMatcher(value);
		}
	}
	return {
		isNonNil: false,
		isValid: false,
		matchValue: "",
		value,
		matches: () => false,
		matchesAny: () => false,
		toString: () => value
	};
}