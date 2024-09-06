import XRegExp from "xregexp";
import { doSimple, getSimpleRegex } from "./doSimple.js";
import { getNumberRegex } from "./getNumberRegex.js";

type Options = { globalFlag?: boolean; };

/** Returns a regular expression that finds:
 * min(...number[])
 * max(...number[])
 * floor(number)
 * ceil(number)
 * round(number)
 */
export function getMathFunctionRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "xgi" : "xi";
	const numberRegex = getNumberRegex({ capture:true }).source;
	const simpleRegex = getSimpleRegex().source;
	return XRegExp(`
		(?:
			${numberRegex}\\s*
			|
			(min|max|floor|ceil|round)
		)?
		\\(\\s*                      # open parentheses, optional spaces
		(                            # open capture group
			${simpleRegex}           # first simple match
			(?:                      # open non-capture group
				\\s*,\\s*            # comma, optional spaces
				${simpleRegex}       # additional simple match
			)*                       # close non-capture group, allow any number of them
		)                            # close capture group
		\\s*\\)                      # close parentheses, optional spaces
		(?!\\d*d\\d+)                # ignore the entire thing if followed by dY or XdY
	`, flags);
}

/** Convenience for getMathFunctionRegex().test(value) */
export function hasMathFunctions(value: string): boolean {
	return getMathFunctionRegex().test(value);
}

/** Checks the value for min/max/floor/ceil/round and replaces it with the result. */
export function doMathFunctions(value: string): string {
	const regex = getMathFunctionRegex({ globalFlag:true });
	while (regex.test(value)) {
		value = value.replace(regex, (_, _multiplier: string | undefined, _functionName: string | undefined, _args: string) => {
			// split on space,space and convert to numbers
			const args = _args.split(/\s*,\s*/).map(s => +doSimple(s)!);

			// handle a math function
			if (_functionName !== undefined) {
				// lower case and cast type
				const functionName = _functionName?.toLowerCase() as "min";
				// do the math
				const result = Math[functionName](...args);
				// return a string
				return String(result);
			}

			if (_multiplier !== undefined) {
				// return the new math so that it can be reprocessed
				return `${_multiplier}*${args[0]}`;
			}

			return `${args[0]}`;
		});
	}
	return value;
}