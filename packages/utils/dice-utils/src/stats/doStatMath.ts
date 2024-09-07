import { tokenize } from "../internal/tokenize.js";
import { processMath } from "../math/processMath.js";
import { getDiceRegex } from "../token/getDiceRegex.js";

/**
 * Checks the stat value for math.
 * If no math is found, then the value is returned.
 * If math is found, then it is calculated.
 * If pipes (spoilers) are found then they are removed for calculation and the return value is wrapped in pipes.
 * (Primarily for hiding values, such as AC.)
 */
export function doStatMath(value: string): string {
	// process other math functions on non-dice parts of the value
	const tokens = tokenize(value, { dice:getDiceRegex() });
	const processed = tokens.map(({ token, key }) => key === "dice" ? token : processMath(token, { allowSpoilers:true }));
	return processed.join("");
}