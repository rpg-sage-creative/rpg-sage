import { getOrCreateRegex, type RegExpAnchorOptions, type RegExpCaptureOptions, type RegExpFlagOptions, type RegExpQuantifyOptions } from "@rsc-utils/core-utils";
import emojiRegex from "emoji-regex-xs";

type Options = RegExpFlagOptions & RegExpAnchorOptions & RegExpCaptureOptions & RegExpQuantifyOptions;

/** Reusable function for ensuring consistent regex creation. */
function createUnicodeEmojiRegex(options?: Options): RegExp {
	const { gFlag = "", iFlag = "i" } = options ?? {};
	const flags = `${gFlag}${iFlag}u`;

	return new RegExp(emojiRegex(), flags);
}

/**
 * Returns an instance of the unicode emoji regexp.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 * Default options: { anchored:false, capture:undefined, gFlag:"", iFlag:"", quantifier:"" }
 */
export function getUnicodeEmojiRegex(options?: Options): RegExp {
	return getOrCreateRegex(createUnicodeEmojiRegex, options);
}