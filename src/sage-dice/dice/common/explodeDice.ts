import { rollDice } from "@rsc-utils/dice-utils";

/**
 * Checks a set of die roll values for exloding dice, rolling exploded dice as needed
 * @param dieSize the size of the die being exploded
 * @param dieValues the values of the original roll
 * @param explodeValues which die values count as exploding
 * @returns all the new values rolled due to exploding dice
 */
export function explodeDice(dieSize: number, dieValues: number[], ...explodeValues: number[]): number[] {
	const explodedValues: number[] = [];
	let extra = dieValues.filter(value => explodeValues.includes(value)).length;
	while (extra > 0) {
		const roll = rollDice(1, dieSize)[0];
		explodedValues.push(roll);
		if (!explodeValues.includes(roll)) {
			extra--;
		}
	}
	return explodedValues;
}
