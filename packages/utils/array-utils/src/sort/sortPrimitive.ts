import type { Optional } from "@rsc-utils/type-utils";
import { isDate } from "util/types";
import type { SortResult } from "./SortResult.js";

/** Sorts values in ascending order. */
export function sortPrimitive<T extends Date | number | string>(a: Optional<T>, b: Optional<T>): SortResult {
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

	// return less than / greater than results
	if (a < b) {
		return -1;
	}else if (a > b) {
		return 1;
	}

	// check data types
	if (a !== b) {
		// dates are objects and equal dates still fail ===
		const aDate = isDate(a);
		const bDate = isDate(b);
		if (aDate || bDate) {
			return sortPrimitive(aDate ? +a as T : a, bDate ? +b as T : b);
		}

		// "2" !== 2; sorting by type makes results consistent
		return (typeof(a)) < (typeof(b)) ? -1 : 1;
	}

	return 0;
}