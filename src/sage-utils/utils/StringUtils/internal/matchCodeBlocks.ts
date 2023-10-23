type CodeBlockMatch = {
	index: number;
	length: number;
	match: string;
	ticks: number;
};

/**
 * @private Finds the next match in the string, starting from the given index
 */
function findNext(content: string, startIndex: number): CodeBlockMatch | null {
	// let's work with a shorter string
	const sliced = content.slice(startIndex);

	// we only want ticks that aren't followed by slashes, min 1 max 3
	const leftRegex = /((?<!\\)`){1,3}/;
	const leftMatch = leftRegex.exec(sliced);
	if (!leftMatch) {
		return null;
	}

	let leftIndex = leftMatch.index;
	let ticks = leftMatch[0].length;

	do {
		// we try to grab as many ticks as we can
		const rightRegex = new RegExp(`((?<!\\\\)\`){${ticks}}`);

		// we need to start out regex after the left ticks
		const rightMatch = rightRegex.exec(sliced.slice(leftIndex + ticks));

		if (rightMatch) {
			/** final computed index of first tick */
			const index = startIndex + leftIndex;

			/** total length of match, including ticks */
			const length = rightMatch.index + ticks * 2;

			/** the matched text */
			const match = content.slice(index, index + length);

			// return match
			return { index, length, match, ticks };
		}

		// we didn't get a match, so we try with fewer ticks
		ticks--;

		// we didn't get a match, so we move our start index by one tick
		leftIndex++;

	}while (ticks > 0);

	return null;
}

/**
 * @private Finds all the matches in a given string
 */
export function matchCodeBlocks(content: string): CodeBlockMatch[] {
	const matches: CodeBlockMatch[] = [];

	let lastIndex = 0;
	let match: CodeBlockMatch | null;
	while (match = findNext(content, lastIndex)) {
		matches.push(match);
		lastIndex = match.index + match.length;
	}

	return matches;
}