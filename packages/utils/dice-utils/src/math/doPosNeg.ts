import { LogQueue } from "@rsc-utils/core-utils";
import { xRegExp } from "../internal/xRegExp.js";
import { getNumberRegex } from "./getNumberRegex.js";
import { unpipe } from "./unpipe.js";

type Options = {
	allowSpoilers?: boolean;
	globalFlag?: boolean;
};

/** Returns a regular expression that finds tests for only simple math operations. */
export function getPosNegRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "xgi" : "xi";
	const numberRegex = getNumberRegex({ allowSpoilers:options?.allowSpoilers }).source;
	const posNegRegex = `
		(?:
			(?:[-+]\\s*){2,}      # extra pos/neg signs
			${numberRegex}        # pos/neg decimal number
		)
	`;
	const spoilered = options?.allowSpoilers
		? `(?:${posNegRegex}|\\|\\|${posNegRegex}\\|\\|)`
		: `(?:${posNegRegex})`;

	return xRegExp(spoilered, flags);
}

/** Attempts to do the math and returns true if the result was not null. */
export function hasPosNeg(value: string, options?: Omit<Options, "globalFlag">): boolean {
	return getPosNegRegex(options).test(value);
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid math symbols: [-+/*%^] and spaces and numbers.
 * Returns undefined if the value isn't simple math.
 * Returns null if an error occurred during eval().
 */
export function doPosNeg(input: string, options?: Omit<Options, "globalFlag">): string {
	const logQueue = new LogQueue("doPosNeg", input);
	let output = input;
	const regex = getPosNegRegex({ globalFlag:true, allowSpoilers:options?.allowSpoilers });
	while (regex.test(output)) {
		output = output.replace(regex, value => {
			const { hasPipes, unpiped } = unpipe(value);

			const retVal = (result: string) => {
				logQueue.add({label:"retVal",value,result});
				return hasPipes ? `||${result}||` : result;
			};

			try {

				// by spacing the -- or ++ characters, the eval can properly process them
				const prepped = unpiped.replace(/-+|\++/g, s => s.split("").join(" "));

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
		logQueue.add({label:"while",input,output});
	}
	// logQueue.logDiff(output);
	return output;
}
