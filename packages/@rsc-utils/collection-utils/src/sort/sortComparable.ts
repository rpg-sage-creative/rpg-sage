import type { Optional } from "@rsc-utils/type-utils";
import type { Comparable, SortResult } from "./types.js";

/**
 * Sorts Comparable objects in ascending order by delegating to their compareTo method.
 * Identical references return 0 without calling compareTo.
 * undefined is considered the "greatest" value. (last/end of the array)
 * null is considered the "second greatest" value. (second to last/end of array before undefined)
 * The nullish ordering matches sortPrimitive; NaN and Invalid Date tiers have no analogue since Comparable values are objects.
 */
export function sortComparable<T>(a: Optional<Comparable<T>>, b: Optional<Comparable<T>>): SortResult {
	// identical items should always return 0
	if (a === b) return 0;

	// undefined is the "greatest" value
	if (a === undefined) {
		return 1;
	}else if (b === undefined) {
		return -1;
	}

	// null is the "second greatest" value
	if (a === null) {
		return 1;
	}else if (b === null) {
		return -1;
	}

	return a.compareTo(b);
}
