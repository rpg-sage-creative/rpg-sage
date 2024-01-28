import { randomInt as _randomInt } from "crypto";

/**
 * Ensures min/max are correct before creating the random int.
 */
export function randomInt(min: number, max: number): number {
	if (min === max) {
		return min;
	}
	return _randomInt(Math.min(min, max), Math.max(min, max) + 1);
}