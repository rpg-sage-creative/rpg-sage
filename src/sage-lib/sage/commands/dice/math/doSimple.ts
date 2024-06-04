import XRegExp from "xregexp";
import { cleanSigns } from "./cleanSigns.js";

/** Returns a regular expression that finds tests for only numbers and math symbols. */
function getSimpleRegex(): RegExp {
	return /^[\s\d.()^*/+-]+$/;
}

/** Attempts to do the math and returns true if the result was not null. */
export function isSimple(value: string): boolean {
	return doSimple(value) !== null;
}

/**
 * Ensures the value has only mathematical characters before performing an eval to get the math results.
 * Valid math symbols: ^/*+- and spaces and numbers.
 * Returns null if the value isn't simple math or an error occurred during eval().
 */
export function doSimple(value: string): string | null {
	try {
		if (getSimpleRegex().test(value)) {
			value = cleanSigns(value);
			value = XRegExp.replaceEach(value, [
				// remove spaces
				[/\s/g, ""],
				// add multiplication sign: 2(6+1) becomes 2*(6+1)
				[/(\d+)\(([^()]+)\)/g, "$1*($2)"],
				// change power symbol
				[/\^/g, "**"]
			]);
			return String(eval(value));
		}
	} catch (ex) {
		/* ignore */
	}
	return null;
}
