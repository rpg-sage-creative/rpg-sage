import type { Optional } from "@rsc-utils/type-utils";
import { sortPrimitive } from "./sortPrimitive.js";
import type { Sorter, SortResult } from "./types.js";

/** Creates a sorter that will sort objects by the values of the given keys. */
export function sortByKey<T>(...keys: (keyof T)[]): Sorter<T> {
	return (a: Optional<T>, b: Optional<T>) => {
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

		// store results where the difference is only case
		const caseSortResults: SortResult[] = [];

		// iterate the keys
		for (const key of keys) {
			// get the values and compare
			const aValue = a?.[key] as string;
			const bValue = b?.[key] as string;
			const sortResult = sortPrimitive(aValue, bValue);

			// compare lower values to see if we need to skip
			const aLower = aValue?.toLowerCase?.() ?? aValue;
			const bLower = bValue?.toLowerCase?.() ?? bValue;
			if (aLower === bLower) {
				// save for later
				caseSortResults.push(sortResult);
			}else if (sortResult !== 0) {
				// return comparison
				return sortResult;
			}
		}

		// check saved results from string values that have equal lowercase comparisons
		for (const sortResult of caseSortResults) {
			if (sortResult !== 0) {
				return sortResult;
			}
		}

		// return equal
		return 0;
	};
}
