import { rollDie } from "./rollDie.js";

/**
 * Returns the results of multiple die rolls.
 */
export function rollDice(count: number, sides: number): number[] {
	const rolls: number[] = [];
	if (count > 0) {
		for (let i = count; i--;) {
			rolls.push(rollDie(sides));
		}
	}
	return rolls;
}
