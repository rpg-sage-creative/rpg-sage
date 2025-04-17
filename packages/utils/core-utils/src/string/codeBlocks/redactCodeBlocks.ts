import { matchCodeBlocks } from "./matchCodeBlocks.js";

/**
 * Converts any characters within back-tick (`) quoted blocks to asterisks.
 * Ex: "a `code` block" becomes "a `****` block".
 * Ignores back-tick characters that are preceded by a slash (\).
 * Ex: " \`doesn't redact\` "
 * Matches 1, 2, or 3 back-tick characters (because Discord's Markdown supports them).
*/
export function redactCodeBlocks(content: string, redactedCharacter = "*") {
	// find all the matches
	const matches = matchCodeBlocks(content);

	// redacted the matches
	matches.forEach(({ index, ticks, length }) => {
		/** the redacted / replacement text */
		const ends = "".padEnd(ticks, "`");
		const center = "".padEnd(length - ticks * 2, redactedCharacter);
		const redacted = ends + center + ends;

		content = content.slice(0, index)
			+ redacted
			+ content.slice(index + length);
	});

	return content;
}
