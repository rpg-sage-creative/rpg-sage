import { getOrCreateRegex } from "../../regex/getOrCreateRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifyOptions, RegExpSpoilerOptions, RegExpWrapOptions } from "../../regex/RegExpOptions.js";

export const WHITESPACE_REGEX_SOURCE = `\\s`;
export const HORIZONTAL_WHITESPACE_REGEX_SOURCE = `[^\\S\\r\\n]`;

type WhitespaceOptions = {
	/** uses HORIZONTAL_WHITESPACE_REGEX_SOURCE if true, \s otherwise */
	horizontalOnly?: boolean;
};

type CreateOptions = RegExpFlagOptions & RegExpQuantifyOptions & WhitespaceOptions;

/** Creates a new instance of the whitespace regex based on options. */
function createWhitespaceRegex(options?: CreateOptions): RegExp {
	const { gFlag = "", horizontalOnly, iFlag = "" } = options ?? {};

	const whitespace = horizontalOnly ? HORIZONTAL_WHITESPACE_REGEX_SOURCE : WHITESPACE_REGEX_SOURCE;
	const flags = gFlag + iFlag;
	return new RegExp(whitespace, flags);
}

type GetOptions = CreateOptions & RegExpAnchorOptions & RegExpCaptureOptions & RegExpSpoilerOptions & RegExpWrapOptions;

/**
 * Returns an instance of the number regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 * Default options: { anchored:false, capture:undefined, gFlag:false, horizontalOnly:false, iFlag:false, quantifier:"+" }
 */
export function getWhitespaceRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createWhitespaceRegex, { quantifier:"+", ...options });
}