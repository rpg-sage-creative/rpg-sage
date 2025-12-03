import { getOrCreateRegex } from "@rsc-utils/core-utils";
import { xRegExp } from "../internal/xRegExp.js";
import { getNumberRegex } from "./getNumberRegex.js";
import { unpipe } from "./unpipe.js";

type Options = {
	allowSpoilers?: boolean;
	gFlag?: "g"|"";
};

/** Returns a regular expression that finds tests for only simple math operations. */
function createSimpleRegex(options?: Options): RegExp {
	const flags = options?.gFlag ? "xgi" : "xi";
	const numberRegex = getNumberRegex({ allowSpoilers:options?.allowSpoilers }).source;
	const orWrappedNumberRegex = `(?:\\(\\s*${numberRegex}\\s*\\)|${numberRegex})`;
	const additionalMathRegex = `
		(?:                          # open group for operands/numbers
			\\s*                     # optional whitespace
			[-+/*%^]                 # operator
			[-+\\s]*                 # possible extra pos/neg signs
			${orWrappedNumberRegex}  # pos/neg decimal number
		)                            # close group for operands/numbers
	`;
	const simpleRegex = `
		(?:
			${orWrappedNumberRegex}  # pos/neg decimal number
			${additionalMathRegex}+  # required additional math
			|
			(?:[-+]\\s*){2,}         # extra pos/neg signs
			${numberRegex}           # pos/neg decimal number
			${additionalMathRegex}*  # optional additional math
		)
	`;
	// const wrapped
	const spoilered = options?.allowSpoilers
		? `(?:${simpleRegex}|\\|\\|${simpleRegex}\\|\\|)`
		: `(?:${simpleRegex})`;

	return xRegExp(`
		(?<!\\w)       # ignore the entire thing if preceded by dY or XdY
		${spoilered}
		(?!\\w)        # ignore the entire thing if followed by dY or XdY
	`, flags);
}

export function getSimpleRegex(options?: Options): RegExp {
	return getOrCreateRegex(createSimpleRegex, options);
}

/** Attempts to do the math and returns true if the result was not null. */
export function hasSimple(value: string, { allowSpoilers }: Omit<Options, "globalFlag"> = { }): boolean {
	return getSimpleRegex({ allowSpoilers }).test(value);
}

const unwrapper = /\(\s*\d+\s*\)/g;
function unwrapNumbers(input: string): string {
	return input.replace(unwrapper, match => match.slice(1, -1));
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid math symbols: [-+/*%^] and spaces and numbers.
 * Returns undefined if the value isn't simple math.
 * Returns null if an error occurred during eval().
 */
export function doSimple(input: string, options?: Omit<Options, "globalFlag">): string {
	let output = input;
	const regex = getSimpleRegex({ gFlag:"g", allowSpoilers:options?.allowSpoilers });
	while (regex.test(output)) {
		output = output.replace(regex, value => {
			const { hasPipes, unpiped } = unpipe(unwrapNumbers(value));

			const retVal = (result: string) => {
				return hasPipes ? `||${result}||` : result;
			};

			try {

				const prepped = unpiped

					// by spacing the -- or ++ characters, the eval can properly process them
					.replace(/-+|\++/g, s => s.split("").join(" "))

					// replace the caret (math exponent) with ** (code exponent)
					.replace(/\^/g, "**");

				// do the math
				const outValue = eval(prepped);

				// it is possible to eval to undefined, treat as an error
				if (outValue === null || outValue === undefined || isNaN(outValue)) {
					return retVal(`(NaN)`);
				}

				// if the evaluated number is a negative, it will start with -, allowing math/parsing to continue
				// therefore, we should leave a + if a sign was present before the eval() call and the result is positive
				const outStringValue = String(outValue);//.trim();
				const signRegex = /^[+-]/;
				const result = signRegex.test(prepped.trim()) && !signRegex.test(outStringValue)
					? `+${outStringValue}`
					: outStringValue;

				return retVal(result);

			}catch(ex) {
				return retVal(`(ERR)`);
			}
		});
	}
	return output;
}
