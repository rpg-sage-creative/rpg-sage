import type { IComparable, TSortResult } from "./types";

//#region Common

export function sortAscending(a: number, b: number): TSortResult;
export function sortAscending(a: string, b: string): TSortResult;
export function sortAscending(a: number | string, b: number | string): TSortResult {
	if (a === b) {
		return 0;
	}
	return a < b ? -1 : 1;
}

export function sortDescending(a: number, b: number): TSortResult;
export function sortDescending(a: string, b: string): TSortResult;
export function sortDescending(a: number | string, b: number | string): TSortResult {
	return sortAscending(b as number, a as number);
}

//#endregion

//#region Comparable

export function sortComparable<T>(a: IComparable<T>, b: IComparable<T>): TSortResult {
	return a.compareTo(b);
}

//#endregion

//#region Strings

export function asStringIgnoreCase(a: any, b: any): TSortResult {
	return stringIgnoreCase(String(a ?? ""), String(b ?? ""));
}

export function stringIgnoreCase(a: string, b: string): TSortResult {
	return sortIgnoreCase(a, a.toLowerCase(), b, b.toLowerCase());
}

/** @deprecated use sortAscending(a, b) */
export const string: (a: string, b: string) => TSortResult = sortAscending;

function sortIgnoreCase(a: string, aLower: string, b: string, bLower: string): TSortResult {
	if (aLower === bLower) {
		return a < b ? 1 : -1;
	}
	return aLower < bLower ? -1 : 1;
}

//#endregion

//#region Numbers

export function asNumber(a: any, b: any): TSortResult {
	return sortAscending(+a, +b);
}

/** @deprecated use sortAscending(a, b) */
export const number: (a: number, b: number) => TSortResult = sortAscending;

//#endregion

//#region Dates

export function asDate(a: any, b: any): TSortResult {
	return date(new Date(a), new Date(b));
}

export function date(a: Date, b: Date): TSortResult {
	return sortAscending(+a, +b);
}

//#endregion
