import { regex } from "regex";
import { DiscordEmojiRegExp } from "./DiscordEmojiRegExp.js";
import { UnicodeEmojiRegExp } from "./UnicodeEmojiRegExp.js";

/** Matches discord emoji and unicode emoji. */
export const EmojiRegExp = regex("i")`${DiscordEmojiRegExp}|${UnicodeEmojiRegExp}`;
