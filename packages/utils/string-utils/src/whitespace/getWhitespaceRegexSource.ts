import { type RegExpQuantifier } from "../regex/RegExpQuantifier.js";
import { HORIZONTAL_WHITESPACE_REGEX } from "../consts.js";

type Options = {
	/** uses HORIZONTAL_WHITESPACE_REGEX if true, \s otherwise */
	horizontalOnly?: boolean;

	/** how many to capture */
	quantifier?: RegExpQuantifier;
};

/**
 * Default options: { horizontalOnly:false, quantifier:"" }
 */
export function getWhitespaceRegexSource(): string;

export function getWhitespaceRegexSource(options: Options): string;

export function getWhitespaceRegexSource(options?: Options): string {
	const regex = options?.horizontalOnly ? HORIZONTAL_WHITESPACE_REGEX : "\\s";
	const quantifier = options?.quantifier ?? "";
	return regex + quantifier;
}
