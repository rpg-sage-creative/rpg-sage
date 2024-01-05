import XRegExp from "xregexp";
import type { RegExpCreateOptions } from "../regex/RegExpCreateOptions.js";
import { HORIZONTAL_WHITESPACE_REGEX } from "./consts.js";

type Options = RegExpCreateOptions & {
	/** uses HORIZONTAL_WHITESPACE_REGEX if true, \s otherwise */
	horizontalOnly?: boolean;
};

/**
 * Convenience for creating/sharing whitespace regex in case we change it later.
 * Uses default options: { globalFlag:false, horizontalOnly:false, quantifier:"+" }
 */
export function createWhitespaceRegex(): RegExp;

/**
 * Convenience for creating/sharing whitespace regex in case we change it later.
 */
export function createWhitespaceRegex(options: Options): RegExp;

export function createWhitespaceRegex(options?: Options): RegExp {
	const flags = options?.globalFlag ? "g" : "";
	const regex = options?.horizontalOnly ? HORIZONTAL_WHITESPACE_REGEX : "\\s";
	const quantifier = options?.quantifier ?? "+";
	if (options?.capture) {
		if (options.capture === true) {
			return XRegExp(`(${regex}${quantifier})`, flags);
		}else {
			return XRegExp(`(?<${options.capture}>${regex}${quantifier})`, flags);
		}
	}
	return XRegExp(regex + quantifier, flags);
}
