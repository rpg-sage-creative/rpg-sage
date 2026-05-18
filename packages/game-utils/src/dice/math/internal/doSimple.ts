import { globalizeRegex, NumberRegExp } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { unpipe } from "../../../utils/pipes/unpipe.js";
import { OrSpoileredPosNegNumberRegExp, prepPosNegSigns } from "./doPosNeg.js";
import { evalMath } from "./evalMath.js";

export const SimpleMathRegExp = regex()`
	(^|\b)                           # ensure there is a wordbreak at the start
	\g<optPosNegSigns>
	(
		\g<orWrappedNumber>      # pos/neg decimal number
		\g<additionalMath>+      # required additional math
		|
		\g<orSpoiledPosNeg>      # decimal number w/ multiple +/- chars
		\g<additionalMath>*      # optional additional math

	)
	(\b|$)                           # ensure there is a wordbreak at the end

	(?(DEFINE)
		(?<optPosNegSigns> [\-+\s]* )

		(?<number> ${NumberRegExp} )
		(?<signedNumber>
			(
				\s*              # optional whitespace
				[\-+]            # pos/neg signs
				\s*              # optional whitespace
			)?
			\g<number>           # base number regex
		)
		(?<orSpoileredNumber> \|\| \g<signedNumber> \|\| | \g<signedNumber> )
		(?<orWrappedNumber> \( \g<orSpoileredNumber> \) | \g<orSpoileredNumber> )

		(?<additionalMath>
			\s*                  # optional whitespace
			[\-+\/*%^]           # operator
			\g<optPosNegSigns>   # possible extra pos/neg signs
			\g<orWrappedNumber>  # pos/neg decimal number
		)

		(?<orSpoiledPosNeg> ${OrSpoileredPosNegNumberRegExp} )
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
		// track value before changes
		const before = output;

		// replace all matches
		output = output.replace(SimpleMathRegExpG, value => {
			const { hasPipes, unpiped } = unpipe(unwrapNumbers(value));

			const prepped = prepExponents(prepPosNegSigns(unpiped));

			let result = evalMath(prepped);

			const firstChar = result.trimStart()[0];
			if (firstChar !== "-" && firstChar !== "+") {
				result = "+" + result;
			}

			return hasPipes ? `||${result}||` : result;
		});

		// if nothing changed, break out of the loop
		if (before === output) break;
	}
	return output;
}
