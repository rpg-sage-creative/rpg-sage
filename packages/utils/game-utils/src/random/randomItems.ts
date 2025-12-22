import { randomItem } from "./randomItem.js";

/**
 * Returns an array of non-unique random values from the array.
 * @param array array of values to select from
 * @param count number of random values to choose
 */
export function randomItems<T>(array: T[], count: number): T[];

/**
 * Returns an array of random values from the array.
 * @param array array of values to select from
 * @param count number of random values to choose
 * @param unique if true, the same value (using .includes) will not be selected twice
 */
export function randomItems<T>(array: T[], count: number, unique: boolean): T[];

export function randomItems<T>(array: T[], count: number, unique?: boolean): T[] {
	const selections: T[] = [];
	const total = unique === true ? Math.min(array.length, count) : count;
	if (total > 0) {
		do {
			const randomValue = randomItem(array)!;
			if (!unique || !selections.includes(randomValue)) {
				selections.push(randomValue);
			}
		} while (selections.length < total);
	}
	return selections;
}