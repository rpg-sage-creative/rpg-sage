import { randomInt } from "../random/randomInt.js";

/**
 * Returns the results of rolling a single die.
 */
export function rollDie(sides: number): number {
	if (sides < 1) return 0;
	if (sides === 1) return 1;
	return randomInt(1, Math.round(sides));
}
