import { PercentLogger } from "./PercentLogger.js";

/** A convenient mapper that logs progress using the given label. */
export function map<
		OutValue,
		InValue,
	>(
		label: string,
		array: InValue[],
		callbackfn: (value: InValue, index: number, array: InValue[]) => OutValue,
		interval?: number,
	)
		: OutValue[];

/** A convenient mapper that logs progress using the given label. */
export function map<
		OutArray extends Array<OutValue>,
		OutValue,
		InArray extends Array<InValue>,
		InValue,
	>(
		label: string,
		array: InArray,
		callbackfn: (value: InValue, index: number, array: InArray) => OutValue,
		interval?: number,
	)
		: OutArray;

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