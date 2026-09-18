import { randomInt as _randomInt } from "node:crypto";

/**
 * Ensures min/max are correct before creating the random int.
 * If min and max are the same, that value is returned instead of trying to randomize.
 * Convenience for `crypto.randomInt(Math.min(min, max), Math.max(min, max) + 1)`
 */
export function randomInt(min: number, max: number): number {
	// if they are the same, return it
	if (min === max) {
		return min;
	}

	// randomly generate a value
	return _randomInt(Math.min(min, max), Math.max(min, max) + 1);
}