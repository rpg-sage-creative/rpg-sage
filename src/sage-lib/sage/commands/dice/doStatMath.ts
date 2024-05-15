import { doMath } from "./doMath.js";
import { isMath } from "./isMath.js";
import { doMathFunctions } from "./math/doMathFunctions.js";

/**
 * Checks the stat value for math.
 * If no math is found, then the value is returned.
 * If math is found, then it is calculated.
 * If pipes (spoilers) are found then they are removed for calculation and the return value is wrapped in pipes.
 * (Primarily for hiding values, such as AC.)
 */
export function doStatMath(value: string): string {
	// check for piped "hidden" values
	const hasPipes = (/\|{2}[^|]+\|{2}/).test(value);

	// remove pipes
	const unpiped = value.replace(/\|{2}/g, "");

	// process other math functions before passing to simple math
	const processed = doMathFunctions(unpiped);

	// handle simple math if applicable
	if (isMath(`[${processed}]`)) {
		const value = doMath(processed);
		if (value !== null) {
			return hasPipes ? `||${value}||` : value;
		}
	}

	// if we actually did some math, return the change
	if (processed !== unpiped) {
		return hasPipes ? `||${processed}||` : processed;
	}

	return value;
}