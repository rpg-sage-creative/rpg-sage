import type { RegExpCreateOptions } from "@rsc-utils/string-utils";
import XRegExp from "xregexp";
import { getDiscordEmojiRegexSource } from "./getDiscordEmojiRegexSource.js";
import { getUnicodeEmojiRegexSource } from "./getUnicodeEmojiRegexSource.js";

type Options = RegExpCreateOptions & {
	animated?: boolean | "optional";
};

/**
 * Convenience for creating/sharing regex that matches discord emoji _and_ unicode emoji.
 * Uses default options: { globalFlag:false, quantifier:"", animated:"optional" }
 */
export function createEmojiRegex(): RegExp;

/**
 * Convenience for creating/sharing regex that matches discord emoji _and_ unicode emoji.
 */
export function createEmojiRegex(options: Options): RegExp;

export function createEmojiRegex(options?: Options): RegExp {
	const discordEmojiRegex = getDiscordEmojiRegexSource();
	const unicodeEmojiRegex = getUnicodeEmojiRegexSource();
	const regex = `(?:${discordEmojiRegex}|${unicodeEmojiRegex})`;
	const quantifier = options?.quantifier ?? "";
	const flags = options?.globalFlag ? "g" : "";
	if (options?.capture) {
		if (options.capture === true) {
			return XRegExp(`(${regex}${quantifier})`, flags);
		}
		return XRegExp(`(?<${options.capture}>${regex}${quantifier})`, flags);
	}
	return XRegExp(regex + quantifier, flags);
}
