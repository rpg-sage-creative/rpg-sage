/** Calculates the sum total of all the numbers. */
export function sum(values: number[]): number;

/** Calculates the sum total of all the numbers received from the mapper. */
export function sum<T>(values: T[], mapper: (value: T, index: number, values:T[]) => number): number;

export function sum<T>(values: T[], mapper?: (value: T, index: number, values:T[]) => number): number {
	if (mapper) {
		return values.reduce((total, value, index, array) => total + mapper(value, index, array), 0);
	}
	return values.reduce((total, value) => total + (value as number), 0);
}
