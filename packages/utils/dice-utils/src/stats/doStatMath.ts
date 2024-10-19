import { tokenize } from "../internal/tokenize.js";
import { getComplexRegex } from "../math/doComplex.js";
import { doPosNeg, getPosNegRegex } from "../math/doPosNeg.js";
import { processMath } from "../math/processMath.js";

/**
 * Checks the stat value for math.
 * If no math is found, then the value is returned.
 * If math is found, then it is calculated.
 * If pipes (spoilers) are found then they are removed for calculation and the return value is wrapped in pipes.
 * (Primarily for hiding values, such as AC.)
 */
export function doStatMath(value: string): string {
	const options = { allowSpoilers:true };
	const parsers = {
		complex: getComplexRegex(options),
		posNeg: getPosNegRegex(options),
	};
	const tokens = tokenize(value, parsers);
	// process other math functions on non-dice parts of the value
	const processed = tokens.map(({ token, key }) => {
		switch(key) {
			case "complex": return processMath(token, options);
			case "posNeg": return doPosNeg(token, options);
			default: return token;
		}
	});
	return processed.join("");
}