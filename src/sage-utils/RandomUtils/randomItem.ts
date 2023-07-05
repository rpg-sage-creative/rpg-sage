import { generate } from "./generate";

/**
 * Returns a random value from the array.
 * @param array array of values to select from
 */
export function randomItem<T>(array: T[]): T | null {
	const length = array.length;
	if (length === 0) {
		return null;
	}
	if (length === 1) {
		return array[0];
	}
	const index = generate(0, length - 1);
	return array[index];
}
