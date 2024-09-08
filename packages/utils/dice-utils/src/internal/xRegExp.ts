import XRegExp from "xregexp";

const DEBUG = false;

/**
 * @internal
 * The "x" flag from XRegExp is great for readability, but it creates a _LOT_ of (?:) bits in the regex.
 * This cleans the comments and whitespace from "x" flag XRegExp when _NOT_ in debug mode.
 */
export function xRegExp(regex: string, flags: string): RegExp {
	if (DEBUG || !flags.includes("x")) {
		return XRegExp(regex, flags);
	}

	// clean the regex
	regex = regex
		// remove comments
		.replace(/(?<!\\)\#.+\n/g, "")
		// remove whitespace
		.replace(/[\n\t\s]/g, "");

	// clean the flags
	flags = flags.replace(/x/g, "");

	return XRegExp(regex, flags);
}