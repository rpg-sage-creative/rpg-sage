import { randomInt } from "../../random/randomInt.js";

/**
 * Returns the results of rolling a single die, using Math.round(sides) to ensure an integer.
 * If sides < 1 then 0 is returned.
 * If sides === 1 then 1 is returned.
 */
export function rollDie(sides: number): number {
	// let's just not bother rolling anything less than a d1.
	if (sides < 1) {
		return 0;
	}

	// let's not bother with that either.
	if (sides === 1) {
		return 1;
	}

	return randomInt(1, Math.round(sides));
}
