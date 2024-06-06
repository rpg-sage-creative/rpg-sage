import { randomInt } from "../random/randomInt.js";

/**
 * Returns the results of rolling a single die.
 */
export function rollDie(sides: number): number {
	return randomInt(1, sides);
}
