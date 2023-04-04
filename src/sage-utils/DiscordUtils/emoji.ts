import { XRegExp } from "../RegExpUtils";

/** Used to capture the parts of a custom emoji. */
export function createCustomEmojiRegex(): RegExp {
	return /^<(a)?:(\w{2,}):(\d{16,})>$/;
}

/** Options for how many matches to accept when creating Discord emoji regex. */
export enum EmojiRegexMatchCount {
	/** Allow a single or none (use '?') */
	ZeroOrOne = 0,
	/** Only allow a single match (no '*', '+', nor '?') */
	One = 1,
	/** Allow an empty match (use '*') */
	ZeroOrMore = 2,
	/** Allow multiple matches (use '+') */
	OneOrMore = 3
}

/** The options for creating Discord emoji regex. */
export type EmojiRegexOptions = {
	/** Wether to use ^$ or not in the regex. (Ensures the regex matches the whole string.) */
	anchored?: true;
	/** Wether to use a *, +, ? or none in the regex. */
	count?: EmojiRegexMatchCount;
	/** Wether to use the "g" global flag in the regex or not. */
	global?: boolean;
};

/** Convenience for creating/sharing regex that matches discord emoji *OR* unicode emoji. */
export function createEmojiRegex(): RegExp;
export function createEmojiRegex(options: EmojiRegexOptions): RegExp;
export function createEmojiRegex(options: EmojiRegexOptions = { }): RegExp {
	const flags = options.global ? "g" : "";
	const [anchorStart, anchorEnd] = options.anchored ? ["^","$"] : ["",""];

	const matchCount = options.count ?? EmojiRegexMatchCount.One;
	const question = matchCount === EmojiRegexMatchCount.ZeroOrOne ? "?" : "";
	const star = matchCount === EmojiRegexMatchCount.ZeroOrMore ? "*" : "";
	const plus = matchCount === EmojiRegexMatchCount.OneOrMore ? "+" : "";

	const discordEmojiRegex = `<a?:\\w{2,}:\\d{16,}>`;
	const unicodeEmojiRegex = `:\\w{2,}:`;
	const emojiRegex = `(?:${discordEmojiRegex}|${unicodeEmojiRegex})`;

	return XRegExp(`${anchorStart}${emojiRegex}${question}${star}${plus}${anchorEnd}`, flags);
}

/** @todo consider a parser that takes a match from the above regex and parses it into each emoji with meta (name/animated/snowflake) */
