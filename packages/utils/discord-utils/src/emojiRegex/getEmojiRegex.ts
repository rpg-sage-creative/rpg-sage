import { getOrCreateRegex, type RegExpAnchorOptions, type RegExpCaptureOptions, type RegExpFlagOptions, type RegExpQuantifyOptions } from "@rsc-utils/core-utils";
import { getDiscordEmojiRegex } from "./getDiscordEmojiRegex.js";
import { getUnicodeEmojiRegex } from "./getUnicodeEmojiRegex.js";

type Options = RegExpFlagOptions & RegExpAnchorOptions & RegExpCaptureOptions & RegExpQuantifyOptions & {
	animated?: boolean | "optional";
};

/** Reusable function for ensuring consistent regex creation. */
function createEmojiRegex(options?: Options): RegExp {
	const { animated = "optional", gFlag = "", iFlag = "i" } = options ?? {};
	const flags = `${gFlag}${iFlag}u`;

	const discordEmojiRegex = getDiscordEmojiRegex({ animated, iFlag });
	const unicodeEmojiRegex = getUnicodeEmojiRegex({ iFlag });

	return new RegExp(`(?:${discordEmojiRegex.source})|(?:${unicodeEmojiRegex.source})`, flags);
}

/**
 * Returns an instance of the emoji regexp.
 * Convenience for creating/sharing regex that matches discord emoji _and_ unicode emoji.
 * If gFlag is passed, a new regexp is created.
 * If gFlag is not passed, a cached version of the regexp is used.
 * Default options: { animated:"optional", gFlag:"", iFlag:"i" }
 */
export function getEmojiRegex(options?: Options): RegExp {
	return getOrCreateRegex(createEmojiRegex, options);
}
