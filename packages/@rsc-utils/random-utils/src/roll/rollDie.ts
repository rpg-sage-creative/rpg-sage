import { randomInt } from "node:crypto";
import { MaxDieSides } from "./const.js";
import { safeIntegerTypeError } from "../internal/safeIntegerTypeError.js";

/**
 * Returns the results of rolling a single die.
 * Convenience for `randomInt(sides) + 1` with some min bound checking.
 * If sides === 1 then 1 is returned.
 * If sides < 1 || sides > 1000 then 0 is returned.
 * Can throw TypeError.
 */
export function rollDie(sides: number): number {
	if (typeof(sides) !== "number") {
		throw safeIntegerTypeError("sides", 1, MaxDieSides, sides);
	}

	// let's not bother with "rolling" a d1.
	if (sides === 1) {
		return 1;
	}

	// let's not bother rolling anything less than a d1 or greater than a d1000.
	if (sides < 1 || sides > MaxDieSides) {
		return 0;
	}

	// a die is 1 to sides; randomInt(sides) is 0 to sides - 1
	return randomInt(sides) + 1;
}
