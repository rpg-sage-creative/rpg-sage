import { sortPrimitive } from "./sortPrimitive.js";
import type { Sorter, SortResult } from "./types.js";

type Optional<T> = T | null | undefined;

/**
 * Creates a sorter that will sort objects by the values of the given keys.
 * Key values are compared with sortPrimitive and inherit its full ordering contract: undefined > null > NaN > Invalid Date, -0 before 0, dates by timestamp, type-name ties for equal values.
 */
export function sortByKey<T>(...keys: (keyof T)[]): Sorter<T> {
	return (a: Optional<T>, b: Optional<T>) => {
		// identical items should always return 0 (Object.is matches sortPrimitive's identity check)
		if (Object.is(a, b)) {
			return 0;
		}

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
		let caseSortResult: SortResult = 0;

		// iterate the keys
		for (const key of keys) {
			// get the values and compare — sortPrimitive owns NaN, Invalid Date, -0 vs 0, and date timestamps
			const aValue = a[key] as boolean | Date | number | string;
			const bValue = b[key] as boolean | Date | number | string;

			// 0 vs -0
			if (aValue === 0 && bValue === 0 && !Object.is(aValue, bValue)) {
				return Object.is(aValue, -0) ? -1 : 1;
			}

			const sortResult = sortPrimitive(aValue, bValue);

			// already considered equal
			if (sortResult === 0) continue;

			// compare lower values to see if we need to save string comparison for later
			const aLower = typeof(aValue) === "string" ? aValue.toLowerCase() : aValue;
			const bLower = typeof(bValue) === "string" ? bValue.toLowerCase() : bValue;

			// different, return result
			if (aLower !== bLower) {
				return sortResult;
			}

			// save the FIRST case-tie result for later, but keep scanning — a real difference on a later key still wins
			if (caseSortResult === 0) {
				caseSortResult = sortResult;
			}
		}

		// return equal or the first saved case tie
		return caseSortResult;
	};
}
