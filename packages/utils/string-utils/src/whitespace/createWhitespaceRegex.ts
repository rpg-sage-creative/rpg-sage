import XRegExp from "xregexp";
import type { RegExpCreateOptions } from "../regex/RegExpCreateOptions.js";
import { getWhitespaceRegexSource } from "./getWhitespaceRegexSource.js";

type Options = RegExpCreateOptions & {
	/** uses HORIZONTAL_WHITESPACE_REGEX if true, \s otherwise */
	horizontalOnly?: boolean;
};

/**
 * Convenience for creating/sharing whitespace regex.
 * Default options: { globalFlag:false, horizontalOnly:false, quantifier:"+" }
 */
export function createWhitespaceRegex(): RegExp;

export function createWhitespaceRegex(options: Options): RegExp;

export function createWhitespaceRegex(options?: Options): RegExp {
	const regex = getWhitespaceRegexSource({ horizontalOnly:options?.horizontalOnly });
	const quantifier = options?.quantifier ?? "+";
	const flags = options?.globalFlag ? "g" : "";
	if (options?.capture) {
		if (options.capture === true) {
			return XRegExp(`(${regex}${quantifier})`, flags);
		}else {
			return XRegExp(`(?<${options.capture}>${regex}${quantifier})`, flags);
		}
	}
	return XRegExp(regex + quantifier, flags);
}
