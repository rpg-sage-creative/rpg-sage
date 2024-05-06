import type { Optional } from "./generics.js";

/** Convenience type for Optional<string> | TMatcher */
export type MatcherResolvable<Type extends string = string> = Optional<Type> | Matcher<Type>;

/** An umbrella for various Matching classes */
export type Matcher<Type extends string = string> = {
	/** Is the value considered not nil/empty, ex: isNotBlank || isNonNilSnowflake || isNonNilUuid */
	isNonNil: boolean;

	/** Is the value valid for comparison, ex: isDefined || isSnowflake || isUuid */
	isValid: boolean;

	/** The value used to compare to other values. */
	matchValue: string;

	/** The original value. */
	value?: Type | null;

	/** Returns true if the given value is considered a match. */
	matches(value: MatcherResolvable<Type>): boolean;

	/** Returns true if any of the given values are considered a match. */
	matchesAny(values: MatcherResolvable<Type>[]): boolean;

	/** Returns true if any of the given values are considered a match. */
	matchesAny(...values: MatcherResolvable<Type>[]): boolean;

	/** Returns the original value. */
	toString(): Optional<Type>;
};
