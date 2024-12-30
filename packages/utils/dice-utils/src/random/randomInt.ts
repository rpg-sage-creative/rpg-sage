import { randomInt as _randomInt } from "crypto";

/**
 * Ensures min/max are correct before creating the random int.
 */
export function randomInt(min: number, max: number): number {
	const minInt = Math.round(Math.min(min, max));
	const maxInt = Math.round(Math.max(min, max));
	if (minInt === maxInt) {
		return minInt;
	}
	return _randomInt(minInt, maxInt + 1);
}