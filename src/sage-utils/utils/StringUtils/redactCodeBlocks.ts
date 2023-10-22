import { matchCodeBlocks } from "./internal/matchCodeBlocks.js";

/**
 * Converts any characters within `` blocks to asterisks. Ex: "a `code` block" becomes "a `****` block".
 * Matches 1, 2, or 3 ` characters.
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

export function redactCodeBlocksTest() {
	const tests = [
	//   input                          expected output
		[" `redacted` ",               " `********` "],
		[" \\`notredacted\\` ",        " \\`notredacted\\` "],
		[" ``redacted`` ",             " ``********`` "],
		[" \\``redacted`\\` ",         " \\``********`\\` "],
		[" `\\`redacted\\`` ",         " `************` "],
		[" ```redacted``` ",           " ```********``` "],
		[" ```redacted\nredacted``` ", " ```*****************``` "],
		[" \\```redacted``\\` ",       " \\```********``\\` "],
		[" `\\``notredacted`\\`` ",    " `**`notredacted`**` "],
		[" \\``\\`redacted``\\` ",     " \\``**********``\\` "],
		[" \\``\\`redacted``\\` ",     " \\``**********``\\` "],
	];
	tests.forEach(([raw, expected]) => {
		const actual = redactCodeBlocks(raw);
		console.assert(expected === actual, `"${raw}" expected "${expected}" got "${actual}"`);
	});
}