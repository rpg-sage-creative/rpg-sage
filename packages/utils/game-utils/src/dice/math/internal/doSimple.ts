import { getNumberRegex, getOrCreateRegex, type RegExpGetOptions, type RegExpSpoilerOptions } from "@rsc-utils/core-utils";
import { regex } from "regex";
import { unpipe } from "../../internal/pipes.js";
import { getPosNegRegex } from "./doPosNeg.js";
import { evalMath } from "./evalMath.js";

type CreateOptions = RegExpGetOptions & RegExpSpoilerOptions<"optional">;

type GetOptions = RegExpGetOptions & RegExpSpoilerOptions<"optional">;

/** Creates a new instance of the simple math regex based on options. */
function createSimpleRegex(options?: CreateOptions): RegExp {
	const { iFlag = "", spoilers } = options ?? {};

	const numberRegex = getNumberRegex({ iFlag, spoilers });

	const posNegRegex = getPosNegRegex({ iFlag, spoilers });

	/** @todo WHY ISN'T THE FIRST ONE THE SAME AS THE SECOND ONE? SEE COMPLEX ... */
	return regex(iFlag)`
		(?<!\w)                 # ignore the entire thing if preceded a word character
		(
			${numberRegex}      # pos/neg decimal number
			(                   # open group for operands/numbers
				\s*             # optional whitespace
				[\-+\/*%^]      # operator
				[\-+\s]*        # possible extra pos/neg signs
				${numberRegex}  # pos/neg decimal number
			)+                  # close group for operands/numbers
			|
			${posNegRegex}      # decimal number w/ multiple +/- chars
		)
		(?!\w)                  # ignore the entire thing if preceded a word character
	`;
}

/**
 * @internal
 * Returns a cached instance of the simple math regex.
 */
export function getSimpleRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createSimpleRegex, options);
}

/**
 * @internal
 * Tests the value against a simple math regex using the given options.
 */
export function hasSimple(value: string, options?: GetOptions): boolean {
	return getSimpleRegex(options).test(value);
}

/**
 * @internal
 * Replaces all instances of simple math with the resulting calculated value.
 * Valid math symbols: [-+/*%^] and spaces and numbers.
 * Any math resulting in null, undefined, or NaN will have "(NaN)" instead of a numeric result.
 * Any math that throws an error will have "(ERR)" instead of a numeric result.
 */
export function doSimple(input: string, options?: GetOptions): string {
	// const logQueue = new LogQueue("doSimple", input);
	let output = input;

	// get a cached instance of the regexp for testing
	const tester = getSimpleRegex(options);

	// iterate while we have matches
	while (tester.test(output)) {
		// create a new regex to ensure we have our own lastIndex
		const replacer = getSimpleRegex({ gFlag:"g", iFlag:options?.iFlag, spoilers:options?.spoilers });

		// replace all matches
		output = output.replace(replacer, value => {
			const { hasPipes, unpiped } = unpipe(value);

			const prepped = unpiped

				// by spacing the -- or ++ characters, the eval can properly process them
				.replace(/-+|\++/g, s => s.split("").join(" "))

				// replace the caret (math exponent) with ** (code exponent)
				.replace(/\^/g, "**");

			const result = evalMath(prepped);

			// logQueue.add({label:"retVal",value,result});
			return hasPipes ? `||${result}||` : result;
		});
		// logQueue.add({label:"while",input,output});
	}
	// logQueue.logDiff(output);
	return output;
}
