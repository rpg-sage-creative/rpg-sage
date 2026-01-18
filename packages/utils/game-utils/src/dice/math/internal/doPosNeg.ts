import { globalizeRegex } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { unpipe } from "../../../utils/pipes/unpipe.js";
import { evalMath } from "./evalMath.js";

export const PosNegNumberRegExp = regex()`
	(
		[\-+]  # pos/neg
		\s*    # optional space
	){2,}      # two or more
	\d+        # integer
	(\.\d+)?   # optional decimal
`;

export const OrSpoileredPosNegNumberRegExp = regex()`
	\|\| ${PosNegNumberRegExp} \|\|
	|
	${PosNegNumberRegExp}
`;

const OrSpoileredPosNegNumberRegExpG = globalizeRegex(OrSpoileredPosNegNumberRegExp);

/** for prepPosNegSigns() */
const SpacerRegExpG = /-+|\++/g;

/** by spacing the -- or ++ characters, the eval can properly process them */
export function prepPosNegSigns(input: string): string {
	return input.replace(SpacerRegExpG, signs => signs.split("").join(" "));
}

/**
 * Properly converts strings of pos / neg signs to the final (correct) sign.
 * Any eval() resulting in null, undefined, or NaN will have "(NaN)" instead of a numeric result.
 * Any eval() that throws an error will have "(ERR)" instead of a numeric result.
 */
export function doPosNeg(input: string): string {
	let output = input;

	// iterate while we have matches
	while (OrSpoileredPosNegNumberRegExp.test(output)) {
		// replace all matches
		output = output.replace(OrSpoileredPosNegNumberRegExpG, value => {
			const { hasPipes, unpiped } = unpipe(value);

			// by spacing the -- or ++ characters, the eval can properly process them
			const prepped = prepPosNegSigns(unpiped);

			const result = evalMath(prepped);

			return hasPipes ? `||${result}||` : result;
		});
	}
	return output;
}
