import XRegExp from "xregexp";
import createEmojiRegex from "emoji-regex";

export enum DiscordEmojiRegexMatchCount { AllowEmpty = 0, SingleMatch = 1, MultipleMatches = 2 }

/** Convenience for creating/sharing regex that matches discord emoji _and_ unicode emoji. */
export function createDiscordEmojiRegex(matchCount = DiscordEmojiRegexMatchCount.SingleMatch, globalFlag = false): RegExp {
	const discordEmojiRegex = `<a?:\\w{2,}:\\d{16,}>`;
	const unicodeEmojiRegex = createEmojiRegex();
	const flags = globalFlag ? "g" : "";
	const regex = `${discordEmojiRegex}|${unicodeEmojiRegex.source}`;
	if (matchCount !== DiscordEmojiRegexMatchCount.SingleMatch) {
		const plus = matchCount === DiscordEmojiRegexMatchCount.MultipleMatches ? "+" : "";
		const star = matchCount === DiscordEmojiRegexMatchCount.AllowEmpty ? "*" : "";
		return XRegExp(`(?:${regex})${plus}${star}`, flags);
	}
	return XRegExp(regex, flags);
}
