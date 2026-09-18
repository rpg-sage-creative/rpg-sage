import { safeIntegerTypeError } from "../internal/safeIntegerTypeError.js";
import { MaxDiceCount, MaxDieSides } from "./const.js";
import { randomInt } from "node:crypto";

/**
 * Returns the results of multiple die rolls.
 * Can throw TypeError.
 */
export function rollDice(count: number, sides: number): number[] {
	if (typeof(count) !== "number") {
		throw safeIntegerTypeError("count", 1, MaxDiceCount, count);
	}
	if (typeof(sides) !== "number") {
		throw safeIntegerTypeError("sides", 1, MaxDieSides, sides);
	}

	// check count bounds
	if (count < 1 || count > MaxDiceCount) {
		return [];
	}

	// check sides bounds
	if (!sides || sides < 1 || sides > MaxDieSides) {
		return [];
	}

	// let's simplify the output
	if (sides === 1) {
		return [count];
	}

	// create array
	const rolls = new Array<number>(count);

	// roll for each index
	for (let i = 0; i < count; i++) {
		// a die is 1 to sides; randomInt(sides) is 0 to sides - 1
		rolls[i] = randomInt(sides) + 1;
	}

	// return array
	return rolls;
}
