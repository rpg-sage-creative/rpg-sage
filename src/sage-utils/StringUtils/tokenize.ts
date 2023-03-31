//#region types

/** A group of regular expressions used for Tokenizer.tokenize() */
export type TokenParsers = {
	[key: string]: RegExp;
};

/** A token returned from Tokenizer.tokenize() */
export type TokenData = {
	token: string;
	type: string;
	matches: string[]
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
export function tokenize(input: string, parsers: TokenParsers, deftok = "unknown"): TokenData[] {
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
					token: regExpMatchArray[0],
					type: key,
					matches: regExpMatchArray.slice(1)
				};
				matchIndex = regExpMatchArray.index;
			}
		}
		if (matchIndex) {
			// there is text between last token and currently
			// matched token - push that out as default or "unknown"
			tokens.push({
				token: input.slice(0, matchIndex),
				type: deftok,
				matches: []
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
