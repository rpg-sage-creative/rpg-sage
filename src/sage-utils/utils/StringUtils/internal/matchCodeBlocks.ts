type CodeBlockMatch = {
	index: number;
	length: number;
	redacted: string;
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

			const ends = "".padEnd(ticks, "`");
			const center = "".padEnd(rightMatch.index, "*");
			const redacted = ends + center + ends;

			// return match
			return { index, length, redacted, reversedIndex, ticks };
		}

		// we didn't get a match, so we try with fewer ticks
		ticks--;

		// we didn't get a match, so we move our start index by one tick
		leftIndex++;

	}while (ticks > 0);

	return null;
}

export function matchCodeBlocks(content: string): CodeBlockMatch[] {
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

	return matches.reverse();
}