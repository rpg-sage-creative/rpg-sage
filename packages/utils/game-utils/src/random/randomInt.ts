import { randomInt as _randomInt } from "crypto";

/**
 * Ensures min/max are correct and rounded to integer before creating the random int.
 * If min and max are the same, that value is returned instead of trying to randomize.
 */
export function randomInt(min: number, max: number): number {
	// make sure we have the correct min value and round it
	const minInt = Math.round(Math.min(min, max));

	// make sure we have the correct max value and round it
	const maxInt = Math.round(Math.max(min, max));

	// if they are the same, return it
	if (minInt === maxInt) {
		return minInt;
	}

	// randomly generate a value
	return _randomInt(minInt, maxInt + 1);
}