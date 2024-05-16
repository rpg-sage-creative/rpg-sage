import XRegExp from "xregexp";

type Options = { globalFlag?: boolean; };

/** Returns a regular expression that finds a number wrapped in parentheses */
export function getWrappedNumberRegex(options?: Options): RegExp {
	const WRAPPED_REGEX = XRegExp(`
		\\(\\s*                    # open parentheses, optional spaces
		(                          # open capture group
			[-+]?\\d+(?:\\.\\d+)?  # +- decimal number
		)                          # close capture group
		\\s*\\)                    # close parentheses, optional spaces
		`, "x");
	return options?.globalFlag
		? new RegExp(WRAPPED_REGEX, "g")
		: WRAPPED_REGEX;
}

/** Convenience for getWrappedNumberRegex().test(value) */
export function hasWrappedNumbers(value: string): boolean {
	return getWrappedNumberRegex().test(value);
}

/**
 * Unlike other doX functions, we only run this once; to avoid breaking the other functions.
 * ex: round((10)) becomes round(10) and not round10
 */
export function unwrapNumbers(value: string): string {
	const regex = getWrappedNumberRegex({ globalFlag:true });
	return value
		// add multiplication sign
		.replace(/(\d+)\(([^()]+)\)/g, "$1*($2)")
		// replace a wrapped number with just the number
		.replace(regex, wrapped => wrapped.slice(1, -1).trim());
}
