import type { Comparable, SortResult } from "./types.js";

/** Used to sort Comparable objects. */
export function sortComparable<T>(a: Comparable<T>, b: Comparable<T>): SortResult {
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
