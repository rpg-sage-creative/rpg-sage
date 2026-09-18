import { randomInt } from "node:crypto";

/**
 * Returns a random value from the array. Returns undefined if the array is empty.
 * @param array array of values to select from
 */
export function randomItem<T>(array: T[]): T | undefined {
	return array.length === 0
		? undefined
		: array[randomInt(array.length)];
}