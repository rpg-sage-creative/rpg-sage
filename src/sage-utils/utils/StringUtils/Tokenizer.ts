import type { TParsers, TToken } from "./types";

// XRegExp.matchRecursive should improve my tokenization in the future!
// https://www.npmjs.com/package/xregexp

/*
* Tiny tokenizer
*
* - Accepts a subject string and an object of regular expressions for parsing
* - Returns an array of token objects
*
* tokenize('this is text.', { word:/\w+/, whitespace:/\s+/, punctuation:/[^\w\s]/ }, 'invalid');
* result => [{ token="this", type="word" },{ token=" ", type="whitespace" }, Object { token="is", type="word" }, ... ]
*
*/
export function tokenize(input: string, parsers: TParsers, deftok = "unknown"): TToken[] {
	const tokens: TToken[] = [];
	let matchIndex: number,
		regExpMatchArray: RegExpMatchArray,
		token: TToken | null;
	while (input) {
		token = null;
		matchIndex = input.length;
		for (const key in parsers) {
			regExpMatchArray = parsers[key].exec(input)!;
			// try to choose the best match if there are several
			// where "best" is the closest to the current starting point
			if (regExpMatchArray !== null && regExpMatchArray.index !== undefined && regExpMatchArray.index < matchIndex) {
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
				token: input.substr(0, matchIndex),
				type: deftok,
				matches: []
			});
		}
		if (token) {
			// push current token onto sequence
			tokens.push(token);
		}
		input = input.substr(matchIndex + (token ? token.token.length : 0));
	}
	return tokens;
}
