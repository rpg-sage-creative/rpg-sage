import { type Optional } from "@rsc-utils/core-utils";
import XRegExp from "xregexp";
import { getNumberRegex } from "./getNumberRegex.js";

type Options = { anchored?: boolean; };

/** Returns a regular expression that finds tests for only simple math operations. */
export function getSimpleRegex(options?: Options): RegExp {
	const numberRegex = getNumberRegex().source;
	const signsRegex = `[-+\\s]*`;
	const SIMPLE_REGEX = XRegExp(`
		${options?.anchored ? "^" : ""}
		${signsRegex}         # possible extra add/subtract signs
		${numberRegex}        # pos/neg decimal number
		(?:                   # open group for operands/numbers
			\\s*              # optional whitespace
			[-+/*%^]          # operator
			${signsRegex}     # possible extra add/subtract signs
			${numberRegex}    # pos/neg decimal number
		)*                    # close group for operands/numbers
		${options?.anchored ? "$" : ""}
		`, "x");
	return SIMPLE_REGEX;
}

/** Attempts to do the math and returns true if the result was not null. */
export function isSimple(value: string): boolean {
	return doSimple(value) !== undefined;
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid math symbols: ^/*+- and spaces and numbers.
 * Returns undefined if the value isn't simple math.
 * Returns null if an error occurred during eval().
 */
export function doSimple(value: string): Optional<string> {
	try {
		if (getSimpleRegex({ anchored:true }).test(value.trim())) {
			// by spacing the -- or ++ characters, the eval can properly process them
			value = value.replace(/(-|\+)+/g, s => s.split("").join(" "))

			// replace the caret (math exponent) with ** (code exponent)
			value = value.replace(/\^/g, "**");

			// do the math
			const outValue = eval(value);

			// it is possible to eval to undefined, treat as an error
			if (outValue === null || outValue === undefined || isNaN(outValue)) {
				return null;
			}

			// if the evaluated number is a negative, it will start with -, allowing math/parsing to continue
			// therefore, we should leave a + if a sign was present before the eval() call and the result is positive
			const outStringValue = String(outValue).trim();
			const signRegex = /^[+-]/;
			return signRegex.test(value.trim()) && !signRegex.test(outStringValue)
				? `+${outStringValue}`
				: outStringValue;
		}
	} catch (ex: any) {
		return null;
	}
	return undefined;
}
