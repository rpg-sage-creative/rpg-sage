import { globalizeRegex, NumberRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { doPipedMath } from "./doPipedMath.js";
import { OrSpoileredPosNegNumberRegExp } from "./doPosNeg.js";
import { wrapRegex } from "./wrapRegex.js";

export const SimpleMathRegExp = regex()`
	(^|\b|(?<!\w))               # ensure there is a wordbreak at the start
	\g<optPosNegSigns>
	(
		\g<orWrappedNumber>      # pos/neg decimal number
		\g<additionalMath>+      # required additional math
		|
		\g<orSpoiledPosNeg>      # decimal number w/ multiple +/- chars
		\g<additionalMath>*      # optional additional math
	)
	((?!\w)|\b|$)                # ensure there is a wordbreak at the end

	(?(DEFINE)
		(?<optPosNegSigns> [\-+\s]* )

		(?<orWrappedNumber> ${wrapRegex(NumberRegExp, ["||||", "()"], { or:true })} )

		(?<additionalMath>
			\s*                  # optional whitespace
			[\-+\/*%^]           # operator
			\g<optPosNegSigns>   # possible extra pos/neg signs
			\g<orWrappedNumber>  # pos/neg decimal number
		)

		(?<orSpoiledPosNeg> ${OrSpoileredPosNegNumberRegExp} )
	)
`;

export const OrSpoileredSimpleMathRegExp = wrapRegex(SimpleMathRegExp, ["||||"], { or:true });

const SimpleMathRegExpG = globalizeRegex(SimpleMathRegExp);

/**
 * @internal
 * Tests the value against a simple math regex using the given options.
 */
export function hasSimple(value: string): boolean {
	return SimpleMathRegExp.test(value);
}

/**
 * @internal
 * Replaces all instances of simple math with the resulting calculated value.
 * Valid math symbols: [-+/*%^] and spaces and numbers.
 * Any math resulting in null, undefined, or NaN will have "(NaN)" instead of a numeric result.
 * Any math that throws an error will have "(ERR)" instead of a numeric result.
 */
export function doSimple(input: string): string {
	return doPipedMath(input, SimpleMathRegExp, SimpleMathRegExpG);
}
