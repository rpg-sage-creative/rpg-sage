
type CodeBlockMatch = {
	index: number;
	length: number;
	match: string;
	ticks: number;
};

/** @internal Group these regexps together to explicitly see that they are valid but differ in quantity. */
function getTickRegexp(count?: number): RegExp {
	switch(count) {
		case 1: return  /((?<!\\)`){1}/;
		case 2: return  /((?<!\\)`){2}/;
		case 3: return  /((?<!\\)`){3}/;
		default: return /((?<!\\)`){1,3}/;
	}
}

/**
 * @internal Finds the next match in the string, starting from the given index
 */
function findNext(content: string, startIndex: number): CodeBlockMatch | undefined {
	// let's work with a shorter string
	const sliced = content.slice(startIndex);

	// we only want ticks that aren't following slashes, min 1 max 3
	const leftRegex = getTickRegexp();
	const leftMatch = leftRegex.exec(sliced);
	if (!leftMatch) {
		return undefined;
	}

	let leftIndex = leftMatch.index;
	let ticks = leftMatch[0].length;

	do {
		// we try to grab as many ticks as we can
		const rightRegex = getTickRegexp(ticks);

		// we need to start our regex after the left ticks
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

	return undefined;
}

/**
 * @internal Finds all the matches in a given string
 */
export function matchCodeBlocks(content: string): CodeBlockMatch[] {
	const matches: CodeBlockMatch[] = [];

	let lastIndex = 0;
	let match: CodeBlockMatch | undefined;
	while (match = findNext(content, lastIndex)) {
		matches.push(match);
		lastIndex = match.index + match.length;
	}

	return matches;
}