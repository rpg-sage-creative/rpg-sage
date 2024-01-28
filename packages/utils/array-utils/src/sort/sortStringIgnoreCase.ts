import type { Optional } from "@rsc-utils/type-utils";
import type { SortResult } from "./SortResult.js";
import { sortPrimitive } from "./sortPrimitive.js";

/** allows: string | null | undefined */
function toLowerCaseStrict(value: Optional<string>) {
	return value?.toLowerCase() ?? value;
}

/** allows: any */
function toLowerCaseSafe(value: Optional<any>) {
	return value?.toLowerCase?.() ?? value;
}

/**
 * Used to sort strings while ignoring case.
 */
export function sortStringIgnoreCase(a: Optional<string>, b: Optional<string>): SortResult;

/**
 * @internal
 * @private
 * Allows non-strings to be passed in.
 */
export function sortStringIgnoreCase<T>(a: Optional<T>, b: Optional<T>, stringOnly: false): SortResult;

export function sortStringIgnoreCase(a: Optional<string>, b: Optional<string>, stringOnly = true): SortResult {
	// get toLowerCase function
	const toLowerCase = stringOnly ? toLowerCaseStrict : toLowerCaseSafe;

	// run initial sort
	const lowerResult = sortPrimitive(toLowerCase(a), toLowerCase(b));

	// default to ascending order for case insensitive comparison
	if (lowerResult !== 0) {
		return lowerResult;
	}

	// reverse the order for case sensitive comparison to push capitals after lowers
	return sortPrimitive(b, a);
}