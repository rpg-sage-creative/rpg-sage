import { generate } from "./generate";

/**
 * Returns a random value from the array.
 * @param array array of values to select from
 */
export function randomItem<T>(array: T[]): T | null {
	return array.length === 0 ? null : array[generate(1, array.length) - 1];
}
