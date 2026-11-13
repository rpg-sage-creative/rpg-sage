
/** Performant variant of sum() for non-integer floats. */
export const sumPrecise = "sumPrecise" in Math && typeof(Math.sumPrecise) === "function"
	? Math.sumPrecise as (values: number[]) => number
	: sumInts;

/**
 * Calculates the sum total of all the numbers.
 * @deprecated Use sumInts or sumPrecise as appropriate.
 */
export function sum(values: number[]): number;

/** Calculates the sum total of all the numbers received from the mapper. */
export function sum<T>(values: T[], mapper: (value: T, index: number, values:T[]) => number): number;

export function sum<T>(values: T[], mapper?: (value: T, index: number, values:T[]) => number): number {
	// regardless of precision, calling a mapper function defeats the optimization of using Math.sumPrecise
	if (typeof(mapper) === "function") {
		let total = 0;
		for (let i = 0; i < values.length; i++) {
			total += mapper(values[i], i, values);
		}
		return total;
	}
	return sumPrecise(values as number[]);
}

/** Performant variant of sum() optimized for smaller arrays of only integers. */
export function sumInts(values: number[]): number {
	let total = 0;
	for (let i = 0; i < values.length; i++) {
		total += values[i];
	}
	return total;
}