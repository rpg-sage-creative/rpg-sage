import { SnowflakeMatcher, UuidMatcher, debug, isSnowflake, isUuid, type Matcher } from "@rsc-utils/core-utils";

/**
 * Used to create a matcher for an ID.
 * Creates a matcher that always returns false if the given ID isn't a snowflake or uuid.
 */
export function getIdMatcher(value: string): Matcher {
	if (value) {
		if (isSnowflake(value)) {
			return new SnowflakeMatcher(value);
		}
		if (isUuid(value)) {
			return new UuidMatcher(value);
		}
	}
	const outVal = typeof(value) === "string" ? `"${value}"` : `${value}`;
	debug(`Invalid ID value: ${outVal}`);
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