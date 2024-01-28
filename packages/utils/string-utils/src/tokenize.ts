//#region types

/** A group of regular expressions used for Tokenizer.tokenize() */
export type TokenParsers = {
	[key: string]: RegExp;
};

/** A token returned from Tokenizer.tokenize() */
export type TokenData<Key extends string = string> = {
	/** the TokenParsers key of the RegExp that matched */
	key: Key;
	/** the match groups captured by the RegExp */
	matches: string[]
	/** the substring that matched the RegExp */
	token: string;
};

//#endregion

// XRegExp.matchRecursive should improve my tokenization in the future!
// https://www.npmjs.com/package/xregexp

/*
* Tiny tokenizer
*
* - Accepts a subject string and an object of regular expressions for parsing
* - Returns an array of token objects
*
* tokenize('this is text.', { word:/\w+/, whitespace:/\s+/, punctuation:/[^\w\s]/ }, 'invalid');
* result => [{ token="this", type="word" }, { token=" ", type="whitespace" }, { token="is", type="word" }, ... ]
*
*/
export function tokenize(input: string, parsers: TokenParsers, defaultKey = "unknown"): TokenData[] {
	const tokens: TokenData[] = [];
	let matchIndex: number,
		token: TokenData | null;
	while (input) {
		token = null;
		matchIndex = input.length;
		for (const key in parsers) {
			const regExpMatchArray = parsers[key].exec(input);
			// try to choose the best match if there are several
			// where "best" is the closest to the current starting point
			if (regExpMatchArray?.index !== undefined && regExpMatchArray.index < matchIndex) {
				token = {
					key,
					matches: regExpMatchArray.slice(1),
					token: regExpMatchArray[0]
				};
				matchIndex = regExpMatchArray.index;
			}
		}
		if (matchIndex) {
			// there is text between last token and currently
			// matched token - push that out as default or "unknown"
			tokens.push({
				key: defaultKey,
				matches: [],
				token: input.slice(0, matchIndex)
			});
		}
		if (token) {
			// push current token onto sequence
			tokens.push(token);
		}
		input = input.slice(matchIndex + (token?.token.length ?? 0));
	}
	return tokens;
}
