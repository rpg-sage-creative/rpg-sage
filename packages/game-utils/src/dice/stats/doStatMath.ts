import { tokenize } from "@rsc-utils/core-utils";
import { UrlRegExp } from "@rsc-utils/io-utils";
import { ComplexMathRegExp } from "../math/internal/doComplex.js";
import { doPosNeg, PosNegNumberRegExp } from "../math/internal/doPosNeg.js";
import { SimpleMathRegExp } from "../math/internal/doSimple.js";
import { processMath } from "../math/processMath.js";

/**
 * Checks the stat value for math.
 * If no math is found, then the value is returned.
 * If math is found, then it is calculated.
 * If pipes (spoilers) are found then they are removed for calculation and the return value is wrapped in pipes.
 * (Primarily for hiding values, such as AC.)
 */
export function doStatMath(value: string): string {
	const parsers = {
		url: UrlRegExp,
		complex: ComplexMathRegExp,
		simple: SimpleMathRegExp,
		posNeg: PosNegNumberRegExp,
	};
	const tokens = tokenize(value, parsers);
	// process other math functions on non-dice parts of the value
	const processed = tokens.map(({ token, key }) => {
		switch(key) {
			case "url": // we detect urls so that we can avoid processing / as division
			case "complex": return processMath(token);
			case "simple": return processMath(token);
			case "posNeg": return doPosNeg(token);
			default: return token;
		}
	});
	return processed.join("");
}