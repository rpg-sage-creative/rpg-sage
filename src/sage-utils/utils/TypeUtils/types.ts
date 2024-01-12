import type { Awaitable, Optional } from "@rsc-utils/type-utils";

/** Represents an object that can be saved. */
export type Saveable = {
	/** Attempts to save the object, returning true if successful, or false otherwise. */
	save(): Awaitable<boolean>;
}

//#region generic xMatcher

/** An umbrella for various Matching classes */
export type TMatcher = {
	/** Compares a given value. */
	matches(value: TMatcherResolvable): boolean;

	/** Returns the matcher's value or "" if the value was null or undefined. */
	toString(): string;
}

/** Convenience type for Optional<string> | TMatcher */
export type TMatcherResolvable = Optional<string> | TMatcher;

//#endregion
