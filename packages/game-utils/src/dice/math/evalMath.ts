import { error } from "@rsc-utils/core-utils";
import { reapplySign } from "./internal/reapplySign.js";

/** avoids running eval on anything except math */
const UnsafeMathRegExp = /[^\d\s\.\-+\/*%^()]/;

/** for stripLeadingZeros() */
const LeadingZeroRegExpG = /\b(?<!\d\.)0+([1-9])/g;

/**
 * Finds all numbers with leading zeros and removes the leading zeros.
 * This avoids the issue of numbers being treated as octals, which is not allowed in strict mode.
 */
function stripLeadingZeros(input: string): string {
	return input.replaceAll(LeadingZeroRegExpG, (_, num) => num);
}

/** by spacing the -- or ++ characters, the eval can properly process them */
function prepPosNegSigns(input: string): string {
	return input
		.replaceAll("-", " - ")
		.replaceAll("+", " + ");
}

/** replace the caret (math exponent) with ** (code exponent) */
function prepExponents(input: string): string {
	return input.replaceAll("^", "**");
}

/**
 * Performs some safety checks against the given input before using eval() to process the math equation.
 * Any non-math characters found cause a RangeError to be thrown.
 * Leading 0s are stripped from numbers to avoid them being read as octal (not allowed in strict mode).
 * Plus/Minus signs are surrounded by spaces to avoid -- or ++ throwing exceptions.
 * Exponent caret "^" characters are converted to "**".
 * Any value that returns null, undefined, on NaN results in "(NaN)" being returned.
 * The resulting value preserves leading/trailing whitespace as well as a leading +/- sign.
 * Any math that throws an exception results in an error being logged and "(ERR)" being returned.
 * @param input a math string
 * @returns string representation of the resulting value
 */
export function evalMath(input: string): string {
	try {
		if (UnsafeMathRegExp.test(input)) {
			throw new RangeError("Invalid Math String!");
		}

		// Numbers with leading zeros get treated as octal, which is not allowed in strict mode.
		const octalSafe = stripLeadingZeros(input);

		// by spacing the -- or ++ characters, the eval can properly process them
		const signSafe = prepPosNegSigns(octalSafe);

		// convert ^ with **
		const exponentSafe = prepExponents(signSafe);

		// do the math
		const outValue = eval(exponentSafe);

		// it is possible to eval to undefined, treat as an error
		if (outValue === null || outValue === undefined || isNaN(outValue)) {
			return `(NaN)`;
		}

		// if the evaluated number is a negative, it will start with -, allowing math/parsing to continue
		// therefore, we should leave a + if a sign was present before the eval() call and the result is positive
		const outStringValue = String(outValue);

		const outWithSign = reapplySign(input, outStringValue);

		return outWithSign;

	}catch(ex) {
		error(`evalMath threw an exception for: ${input}`, ex);
		return `(ERR)`;
	}
}
