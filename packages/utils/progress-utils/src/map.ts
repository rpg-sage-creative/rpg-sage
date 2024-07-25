import { PercentLogger } from "./PercentLogger.js";

/** A convenient mapper that logs progress using the given label. */
export function map
		<T, U>
		(label: string, array: U[], callbackfn: (value: U, index: number, array: U[]) => T, interval?: number)
		: T[];

/** A convenient mapper that logs progress using the given label. */
export function map
		<T extends Array<U>, U, V extends Array<W>, W>
		(label: string, array: V, callbackfn: (value: W, index: number, array: V) => U, interval?: number)
		: V;

export function map
		(label: string, array: any[], callbackfn: (value: any, index: number, array: any[]) => any, interval?: number)
		: any[] {

	const pLogger = new PercentLogger(label, array.length, interval);

	// trigger the 0% before processing the first item
	pLogger.start();

	return array.map((val, i, arr) => {
		const out = callbackfn(val, i, arr);
		pLogger.increment();
		return out;
	});
}