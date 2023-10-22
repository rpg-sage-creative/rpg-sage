import { matchCodeBlocks } from "./internal/matchCodeBlocks.js";

/**
 * Converts any characters within back-tick (`) quoted blocks to asterisks.
 * Ex: "a `code` block" becomes "a `****` block".
 * Ignores back-tick characters that are preceded by a slash (\).
 * Ex: " \`doesn't redact\` "
 * Matches 1, 2, or 3 back-tick characters (because Discord's Markdown supports them).
*/
export function redactCodeBlocks(content: string) {
	// find all the matches
	const matches = matchCodeBlocks(content);

	// redacted the matches
	matches.forEach(match => {
		content = content.slice(0, match.index)
			+ match.redacted
			+ content.slice(match.index + match.length);
	});

	return content;
}

/** A handful of tests to ensure the logic is working. */
export function redactCodeBlocksTest() {
	const tests = [
	//   input                          expected output
		[" hi `redacted` no `shit` ",   " hi `********` no `****` "],
		[" \\`notredacted\\` `hi` go ", " \\`notredacted\\` `**` go "],
		["`0` ``redacted`` \\`9`",      "`*` ``********`` \\`9`"],
		[" \\``redacted`\\` ",          " \\``********`\\` "],
		[" `\\`redacted\\`` ",          " `************` "],
		[" ```redacted``` ",            " ```********``` "],
		[" ```redacted\nredacted``` ",  " ```*****************``` "],
		[" \\```redacted``\\` ",        " \\```********``\\` "],
		[" `\\``notredacted`\\`` ",     " `**`notredacted`**` "],
		[" \\``\\`redacted``\\` ",      " \\``**********``\\` "],
		[" \\``\\`redacted``\\` ",      " \\``**********``\\` "],
	];
	tests.forEach(([raw, expected]) => {
		const actual = redactCodeBlocks(raw);
		console.assert(expected === actual, `"${raw}" expected "${expected}" got "${actual}"`);
	});
}