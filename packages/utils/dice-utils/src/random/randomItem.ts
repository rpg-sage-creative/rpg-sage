import { randomInt } from "./randomInt.js";

/**
 * Returns a random value from the array. Returns null if the array is empty.
 * @param array array of values to select from
 */
export function randomItem<T>(array: T[]): T | null {
	return array.length === 0
		? null
		: array[randomInt(1, array.length) - 1];
}