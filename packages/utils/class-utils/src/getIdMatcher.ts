import { debug } from "@rsc-utils/console-utils";
import { SnowflakeMatcher, isSnowflake } from "@rsc-utils/snowflake-utils";
import { Matcher } from "@rsc-utils/type-utils";
import { UuidMatcher, isUuid } from "@rsc-utils/uuid-utils";

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
	debug(`Invalid ID value: ${JSON.stringify(value)}`);
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