import XRegExp from "xregexp";

const DEBUG = false;

/** @internal */
export function xRegExp(regex: string, flags: string): RegExp {
	if (DEBUG) {
		return XRegExp(regex, flags);
	}

	regex = regex
		// remove comments
		.replace(/\#.+\n/g, "")
		// remove whitespace
		.replace(/[\n\t\s]/g, "");

	flags = flags.replace(/x/g, "");

	return new RegExp(regex, flags);
}