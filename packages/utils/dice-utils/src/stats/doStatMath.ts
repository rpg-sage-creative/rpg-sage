import { tokenize } from "../internal/tokenize.js";
import { doMathFunctions } from "../math/doMathFunctions.js";
import { doSimple } from "../math/doSimple.js";
import { getDiceRegex } from "../token/getDiceRegex.js";

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

	// process other math functions on non-dice parts of the value
	const tokens = tokenize(unpiped, { dice:getDiceRegex() });
	const processedTokens = tokens.map(({ token, key }) => key === "dice" ? token : doMathFunctions(token));
	const processed = processedTokens.join("");

	// handle simple math if applicable
	const simpleValue = doSimple(processed);
	if (simpleValue !== null) {
		return hasPipes ? `||${simpleValue}||` : simpleValue;
	}

	// if we actually did some math, return the change
	if (processed !== unpiped) {
		return hasPipes ? `||${processed}||` : processed;
	}

	return value;
}