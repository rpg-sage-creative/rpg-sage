import { getOrCreateRegex } from "../regex/getOrCreateRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifyOptions } from "../regex/RegExpOptions.js";

/** Expected to be used inside a character class: `[${WORD_CHARACTERS_REGEX_PARTIAL_SOURCE}]` */
// export const WORD_CHARACTERS_REGEX_PARTIAL_SOURCE = `\\w\\p{L}\\p{N}`;

export type RegexWordCharOptions = {
	/** Determines if dashes are allowed. Default: false */
	allowDashes?: boolean;

	/** Determines if periods are allowed. Default: false */
	allowPeriods?: boolean;
};

type CreateOptions = RegExpFlagOptions & RegexWordCharOptions;

/** Creates a new instance of the word character regex based on options. */
function createWordCharacterRegex(options?: CreateOptions): RegExp {
	const { allowDashes, allowPeriods, gFlag = "", iFlag = "" } = options ?? {};
	const dash = allowDashes ? "\\-" : "";
	const period = allowPeriods ? "\\." : "";
	return new RegExp(`[\\w\\p{L}\\p{N}${dash}${period}]`, gFlag + iFlag + "u");
}

type GetOptions = CreateOptions & RegExpAnchorOptions & RegExpCaptureOptions & RegExpQuantifyOptions;

/**
 * Returns an instance of the word character regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 * Default options: { allowDashes:false, allowPeriods:false, anchored:false, capture:undefined, gFlag:false, iFlag:false, quantifier:"" }
 */
export function getWordCharacterRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createWordCharacterRegex, options);
}