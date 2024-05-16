import XRegExp from "xregexp";
import { doSimple } from "./doSimple.js";

type Options = { globalFlag?: boolean; };

/**
 * Returns a regular expression that finds parentheses with simple math in them.
 * @todo alter the regex to explicitly find math instead of hoping we are good enough, this part: [^\\d.()]
 */
export function getParenthesesRegex(options?: Options): RegExp {
	const PAREN_REGEX = XRegExp(`
		\\(         # open parentheses
		[^()]*      # optional non-parentheses
		[^\\d.()]   # we need a non-number/decimal *and* non-parentheses
		[^()]*      # optional non-parentheses
		\\)         # close parentheses
		`, "x");
	return options?.globalFlag
		? new RegExp(PAREN_REGEX, "gi")
		: PAREN_REGEX;
}

/** Convenience for getParenthesesRegex().test(value) */
export function hasParentheses(value: string): boolean {
	return getParenthesesRegex().test(value);
}

/**
 * Unlike other doX functions, we only run this once; to avoid breaking the other functions.
 * Finds parentheses with math in them and replaces them with the result of doSimple(match).
 */
export function doParentheses(value: string): string {
	const regex = getParenthesesRegex({ globalFlag:true });
	return value.replace(regex, match => {
		const sliced = match.slice(1, -1);
		const result = doSimple(sliced);
		return `(${result ?? 0})`;
	});
}