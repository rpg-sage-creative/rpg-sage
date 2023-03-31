
//#region types

/** Represents a function that sorts an array of objects. */
export type TSorter<T> = (a: T, b: T) => TSortResult;

/** Represents the results of a Sorter function. */
export type TSortResult = -1 | 0 | 1;

/** Represents an object that can be sorted. */
export interface IComparable<T> {
	compareTo(other: IComparable<T>): TSortResult;
}

//#endregion

//#region Common

/** Sorts the numbers ascending. */
export function sortAscending(a: number, b: number): TSortResult;

/** Sorts the strings ascending. */
export function sortAscending(a: string, b: string): TSortResult;

export function sortAscending(a: number | string, b: number | string): TSortResult {
	if (a === b) {
		return 0;
	}
	return a < b ? -1 : 1;
}

/** Sorts the numbers descending. */
export function sortDescending(a: number, b: number): TSortResult;

/** Sorts the strings descending. */
export function sortDescending(a: string, b: string): TSortResult;

export function sortDescending(a: number | string, b: number | string): TSortResult {
	return sortAscending(b as number, a as number);
}

//#endregion

//#region Comparable

/** Sorts the comparable objects according to their compareTo logic. */
export function sortComparable<T>(a: IComparable<T>, b: IComparable<T>): TSortResult {
	return a.compareTo(b);
}

//#endregion

//#region Strings

/**
 * Sorts the objects as strings ascending, ignoring case.
 * Convenience for stringIngoreCase(String(a ?? ""), String(b ?? "")).
 */
export function asStringIgnoreCase(a: any, b: any): TSortResult {
	return stringIgnoreCase(String(a ?? ""), String(b ?? ""));
}

/** Sorts the strings ascending, ignoring case. */
export function stringIgnoreCase(a: string, b: string): TSortResult {
	return sortIgnoreCase(a, a.toLowerCase(), b, b.toLowerCase());
}

/** @deprecated use sortAscending(a, b) */
export const string = sortAscending;

/** Internal ignoreCase sorter, includes original case in case lower is identical. */
function sortIgnoreCase(a: string, aLower: string, b: string, bLower: string): TSortResult {
	if (aLower === bLower) {
		return a < b ? 1 : -1;
	}
	return aLower < bLower ? -1 : 1;
}

//#endregion

//#region Numbers

/** Sorts the objects as numbers, ascending. */
export function asNumber(a: any, b: any): TSortResult {
	return sortAscending(+a, +b);
}

/** @deprecated use sortAscending(a, b) */
export const number = sortAscending;

//#endregion

//#region Dates

/** Sorts the objects as Dates, ascending. */
export function asDate(a: any, b: any): TSortResult {
	return date(new Date(a), new Date(b));
}

/** Sorts the dates acending. */
export function date(a: Date, b: Date): TSortResult {
	return sortAscending(+a, +b);
}

//#endregion
