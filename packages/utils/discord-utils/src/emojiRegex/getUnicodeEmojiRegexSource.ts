import createEmojiRegex from "emoji-regex";

/**
 * Returns the string source of a unicode emoji string.
 */
export function getUnicodeEmojiRegexSource(): string {
	return createEmojiRegex().source;
}