import { SnowflakeMatcher, UuidMatcher, isSnowflake, isUuid, type Matcher, type Optional } from "@rsc-utils/core-utils";

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