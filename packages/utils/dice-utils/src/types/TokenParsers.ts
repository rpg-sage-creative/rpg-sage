/**
 * @internal
 * @private
 * A group of regular expressions used for Tokenizer.tokenize()
 */
export type TokenParsers = {
	[key: string]: RegExp;
};
