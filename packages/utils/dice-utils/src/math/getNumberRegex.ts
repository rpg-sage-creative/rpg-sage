import XRegExp from "xregexp";

type Options = { globalFlag?: boolean; };

/** A reusable way to get proper regex for a valid +/- integer or decimal. */
export function getNumberRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "xg" : "x";
	return XRegExp(`
		(?:               # open non-capture group
			[+-]?         # optional pos/neg sign
			\\d+          # integer portion
			(?:\\.\\d+)?  # optional decimal portion
		)                 # close non-capture group
	`, flags);
}
