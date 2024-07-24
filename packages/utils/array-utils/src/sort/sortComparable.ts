import { type Comparable } from "./Comparable.js";
import { type SortResult } from "./SortResult.js";

/** Used to sort Comparable objects. */
export function sortComparable<T>(a: Comparable<T>, b: Comparable<T>): SortResult {
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
