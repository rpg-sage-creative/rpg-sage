import emojiRegex from "emoji-regex-xs";

/** Matches unicode emoji. */
export const UnicodeEmojiRegExp = new RegExp(emojiRegex(), "iu");
