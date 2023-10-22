type CodeBlockMatch = {
	index: number;
	length: number;
	reversedIndex: number;
	ticks: number;
};

function findNext(reversed: string, startIndex: number): CodeBlockMatch | null {
	// let's work with a shorter string
	const sliced = reversed.slice(startIndex);

	// we only want ticks that aren't followed by slashes, min 1 max 3
	const leftRegex = /(`(?!\\)){1,3}/;
	const leftMatch = leftRegex.exec(sliced);
	if (!leftMatch) {
		return null;
	}

	let leftIndex = leftMatch.index;
	let ticks = leftMatch[0].length;

	do {
		// we try to grab as many ticks as we can
		const rightRegex = new RegExp(`(\`(?!\\\\)){${ticks}}`);

		// we need to start out regex after the left ticks
		const rightMatch = rightRegex.exec(sliced.slice(leftIndex + ticks));

		if (rightMatch) {
			/** final computed index of first tick in the reversed string */
			const reversedIndex = startIndex + leftIndex;
			/** total length of match, including ticks */
			const length = rightMatch.index + ticks * 2;
			/** final computed index of first tick in the forward string */
			const index = reversed.length - reversedIndex - length;
			// return match
			return { index, length, reversedIndex, ticks };
		}

		// we didn't get a match, so we try with fewer ticks
		ticks--;

		// we didn't get a match, so we move our start index by one tick
		leftIndex++;

	}while (ticks > 0);

	return null;
}

function redact(match: CodeBlockMatch): string {
	const ticks = "".padEnd(match.ticks, "`");
	const redacted = "".padEnd(match.length - match.ticks * 2, "*");
	return ticks + redacted + ticks;
}

/**
 * Converts any characters within `` blocks to asterisks. Ex: "a `code` block" becomes "a `****` block".
 * Matches 1, 2, or 3 ` characters.
*/
export function redactCodeBlocks(content: string) {
	// reverse the string for simpler regex of escaped back-ticks
	const reversed = content.split("").reverse().join("");

	// find all the matches
	const matches: CodeBlockMatch[] = [];
	let match: CodeBlockMatch | null;
	let lastIndex = 0;
	while (match = findNext(reversed, lastIndex)) {
		matches.push(match);
		lastIndex = match.reversedIndex + match.length;
	}

	// return redacted value
	matches.forEach(match => {
		content = content.slice(0, match.index)
			+ redact(match)
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