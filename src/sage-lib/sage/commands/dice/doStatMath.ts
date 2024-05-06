import { doMath } from "./doMath.js";
import { isMath } from "./isMath.js";

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
	const unpiped = value.replace(/\|{2}/g, "");
	if (isMath(`[${unpiped}]`)) {
		const value = doMath(unpiped);
		if (value !== null) {
			return hasPipes ? `||${value}||` : value;
		}
	}
	return value;
}