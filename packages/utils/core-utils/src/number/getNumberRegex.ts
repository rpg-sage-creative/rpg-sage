import { getOrCreateRegex } from "../regex/getOrCreateRegex.js";
import type { RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpSpoilerOptions } from "../regex/RegExpOptions.js";

type CreateOptions = RegExpFlagOptions;
type GetOptions = RegExpFlagOptions & RegExpAnchorOptions & RegExpCaptureOptions & RegExpSpoilerOptions;

/** Creates a new instance of the number regex based on options. */
function createNumberRegex(options?: CreateOptions): RegExp {
	const { gFlag = "", iFlag = "" } = options ?? {};
	return new RegExp(`[\\-+]?\\d+(?:\\.\\d+)?`, gFlag + iFlag);
}

/**
 * Returns an instance of the number regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 */
export function getNumberRegex(options?: GetOptions): RegExp {
	return getOrCreateRegex(createNumberRegex, options);
}