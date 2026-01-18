import { globalizeRegex, NumberRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { unpipe } from "../../../utils/pipes/unpipe.js";
import { OrSpoileredPosNegNumberRegExp, prepPosNegSigns } from "./doPosNeg.js";
import { evalMath } from "./evalMath.js";

const SimpleMathRegExp = regex()`
	(?<! \w )                    # ignore the entire thing if preceded a word character
	(
		\g<orWrappedNumber>      # pos/neg decimal number
		\g<additionalMath>+      # required additional math
		|
		${OrSpoileredPosNegNumberRegExp} # decimal number w/ multiple +/- chars
		\g<additionalMath>*              # optional additional math
	)
	(?! \w )                     # ignore the entire thing if followed a word character

	(?(DEFINE)
		(?<number> ${NumberRegExp} )
		(?<orSpoileredNumber> \|\| \g<number> \|\| | \g<number> )
		(?<orWrappedNumber> \( \g<orSpoileredNumber> \) | \g<orSpoileredNumber> )
		(?<additionalMath>
			\s*                  # optional whitespace
			[\-+\/*%^]           # operator
			[\-+\s]*             # possible extra pos/neg signs
			\g<orWrappedNumber>  # pos/neg decimal number
		)
	)
`;

export const OrSpoileredSimpleMathRegExp = regex()`
	\|\| ${SimpleMathRegExp} \|\|
	|
	${SimpleMathRegExp}
`;

const SimpleMathRegExpG = globalizeRegex(SimpleMathRegExp);

/**
 * @internal
 * Tests the value against a simple math regex using the given options.
 */
export function hasSimple(value: string): boolean {
	return SimpleMathRegExp.test(value);
}

/** for unwrapNumbers() */
const unwrapper = /\(\s*\d+\s*\)/g;

/** unwraps whole numbers; (4) becomes 4 */
function unwrapNumbers(input: string): string {
	return input.replace(unwrapper, match => match.slice(1, -1));
}

/** for prepExponents() */
const caretMatcher = /\^/g;

/** replace the caret (math exponent) with ** (code exponent) */
function prepExponents(input: string): string {
	return input.replace(caretMatcher, "**");
}

/**
 * @internal
 * Replaces all instances of simple math with the resulting calculated value.
 * Valid math symbols: [-+/*%^] and spaces and numbers.
 * Any math resulting in null, undefined, or NaN will have "(NaN)" instead of a numeric result.
 * Any math that throws an error will have "(ERR)" instead of a numeric result.
 */
export function doSimple(input: string): string {
	let output = input;

	// iterate while we have matches
	while (SimpleMathRegExp.test(output)) {
		// replace all matches
		output = output.replace(SimpleMathRegExpG, value => {
			const { hasPipes, unpiped } = unpipe(unwrapNumbers(value));

			const prepped = prepExponents(prepPosNegSigns(unpiped));

			const result = evalMath(prepped);

			return hasPipes ? `||${result}||` : result;
		});
	}
	return output;
}
