import { globalizeRegex } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { doPipedMath } from "./doPipedMath.js";
import { wrapRegex } from "./wrapRegex.js";

export const PosNegNumberRegExp = regex()`
	(
		[\-+]  # pos/neg
		\s*    # optional space
	){2,}      # two or more
	\d+        # integer
	(\.\d+)?   # optional decimal
`;

export const OrSpoileredPosNegNumberRegExp = wrapRegex(PosNegNumberRegExp, ["||||"], { or:true });

const OrSpoileredPosNegNumberRegExpG = globalizeRegex(OrSpoileredPosNegNumberRegExp);


/**
 * Properly converts strings of pos / neg signs to the final (correct) sign.
 * Any eval() resulting in null, undefined, or NaN will have "(NaN)" instead of a numeric result.
 * Any eval() that throws an error will have "(ERR)" instead of a numeric result.
 */
export function doPosNeg(input: string): string {
	return doPipedMath(input, OrSpoileredPosNegNumberRegExp, OrSpoileredPosNegNumberRegExpG);
}
