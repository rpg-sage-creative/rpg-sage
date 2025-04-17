import { PercentLogger } from "./PercentLogger.js";

/** A convenient iterator that logs progress using the given label. */
export function forEach
		<T>
		(label: string, array: T[], callbackfn: (value: T, index: number, array: T[]) => void, interval?: number)
		: void;

export function forEach
		(label: string, array: any[], callbackfn: (value: any, index: number, array: any[]) => void, interval?: number)
		: void {

	const pLogger = new PercentLogger(label, array.length, interval);

	// trigger the 0% before processing the first item
	pLogger.start();

	array.forEach((val, i, arr) => {
		callbackfn(val, i, arr);
		pLogger.increment();
	});
}