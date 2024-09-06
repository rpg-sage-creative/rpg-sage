import { LogQueue } from "@rsc-utils/core-utils";
import XRegExp from "xregexp";
import { getNumberRegex } from "./getNumberRegex.js";

type Options = { globalFlag?: boolean; };

/** Returns a regular expression that finds tests for only simple math operations. */
export function getSimpleRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "xgi" : "xi";
	const numberRegex = getNumberRegex().source;
	return XRegExp(`
		(?<!d\\d*)                # ignore the entire thing if preceded by dY or XdY

		(?:
			${numberRegex}        # pos/neg decimal number
			(?:                   # open group for operands/numbers
				\\s*              # optional whitespace
				[-+/*%^]          # operator
				[-+\\s]*          # possible extra pos/neg signs
				${numberRegex}    # pos/neg decimal number
			)+                    # close group for operands/numbers
			|
			(?:[-+]\\s*){2,}      # extra pos/neg signs
			${numberRegex}        # pos/neg decimal number
		)

		(?!\\d*d\\d)              # ignore the entire thing if followed by dY or XdY
		`, flags);
}

/** Attempts to do the math and returns true if the result was not null. */
export function hasSimple(value: string): boolean {
	return getSimpleRegex().test(value);
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid math symbols: [-+/*%^] and spaces and numbers.
 * Returns undefined if the value isn't simple math.
 * Returns null if an error occurred during eval().
 */
export function doSimple(input: string): string {
	const logQueue = new LogQueue("doSimple", input);
	let output = input;
	const regex = getSimpleRegex({ globalFlag:true });
	while (regex.test(output)) {
		output = output.replace(regex, value => {
			const retVal = (result: string) => { logQueue.add({label:"retVal",value,result}); return result; };
			try {

				// by spacing the -- or ++ characters, the eval can properly process them
				value = value.replace(/-+|\++/g, s => s.split("").join(" "))

				// replace the caret (math exponent) with ** (code exponent)
				value = value.replace(/\^/g, "**");

				// do the math
				const outValue = eval(value);

				// it is possible to eval to undefined, treat as an error
				if (outValue === null || outValue === undefined || isNaN(outValue)) {
					return retVal(`(NaN)`);
				}

				// if the evaluated number is a negative, it will start with -, allowing math/parsing to continue
				// therefore, we should leave a + if a sign was present before the eval() call and the result is positive
				const outStringValue = String(outValue).trim();
				const signRegex = /^[+-]/;
				const result = signRegex.test(value.trim()) && !signRegex.test(outStringValue)
					? `+${outStringValue}`
					: outStringValue;
				return retVal(result);

			}catch(ex) {
				return retVal(`(ERR)`);
			}
		});
		logQueue.add({label:"while",input,output});
	}
	// logQueue.logDiff(output);
	return output;
}
