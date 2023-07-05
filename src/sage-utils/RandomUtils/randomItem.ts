import { random } from "./random";

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
	const index = random(0, length - 1);
	return array[index];
}
