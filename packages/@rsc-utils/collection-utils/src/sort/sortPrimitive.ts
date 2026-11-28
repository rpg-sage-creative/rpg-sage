import { isDate } from "node:util/types";
import type { Optional } from "@rsc-utils/type-utils";
import type { SortResult } from "./types.js";

/**
 * Sorts values in ascending order.
 * undefined is considered the "greatest" value. (last/end of the array)
 * null is considered the "second greatest" value. (second to last/end of array before undefined)
 * NaN is considered the "third greatest" value. (third to last/end of array before null)
 * Invalid Date is considered the "fourth greatest" value. (fourth to last/end of array before NaN)
 * string vs string comparison is first done ignoring case.
 */
export function sortPrimitive<T extends boolean | Date | number | string>(a: Optional<T>, b: Optional<T>): SortResult {
	// identical items should always return 0:
	// - null === null
	// - undefined === undefined
	// - NaN === NaN
	// safely handles:
	// - 0 !== -0
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

	// NaN is the "third greatest" value; Object.is(a, b) handles NaN === NaN
	if (Number.isNaN(a)) {
		return 1;
	}else if (Number.isNaN(b)) {
		return -1;
	}

	// isDate flags
	const aIsDate = isDate(a);
	const bIsDate = isDate(b);

	// dates as number
	const aDateNum = aIsDate ? +a : undefined;
	const bDateNum = bIsDate ? +b : undefined;

	// treat new Date(NaN) as 2nd tier NaN results ("fourth greatest")
	if (Number.isNaN(aDateNum)) {
		// two invalid dates should be treated as equal, just as NaN === NaN
		return Number.isNaN(bDateNum) ? 0 : 1;
	}else if (Number.isNaN(bDateNum)) {
		return -1;
	}

	// 0 vs -0; Object.is(a, b) lets -0 !== 0 pass, so we must handle it here
	if (a === 0 && b === 0) {
		return Object.is(a, -0) ? -1 : 1;
	}

	// Date vs Date
	if (aIsDate && bIsDate) {
		if (aDateNum === bDateNum) return 0;
		return aDateNum! < bDateNum! ? -1 : 1;
	}

	// types
	const aType = aIsDate ? "date" : typeof(a);
	const bType = bIsDate ? "date" : typeof(b);

	// get lowercase values from strings for good/reliable alpha sorting
	const aLower = aType === "string" ? (a as string).toLowerCase() : a;
	const bLower = bType === "string" ? (b as string).toLowerCase() : b;

	// sort dates as numbers
	// must be tested before aLower v bLower to ensure correct casting
	if (aIsDate && (aDateNum as T) < bLower) {
		return -1;
	}else if (bIsDate && aLower > (bDateNum as T)) {
		return 1;
	}

	// return less than / greater than results
	if (aLower < bLower) {
		return -1;
	}else if (aLower > bLower) {
		return 1;
	}

	// strings that differ only by case
	if (aType === "string" && bType === "string") {
		return a < b ? -1 : 1;
	}

	// "2" !== 2; sorting by type makes results consistent
	return aType < bType ? -1 : 1;

}
