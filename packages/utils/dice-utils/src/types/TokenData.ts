
/**
 * @internal
 * @private
 * A token returned from Tokenizer.tokenize()
 */
export type TokenData<Key extends string = string> = {
	/** the TokenParsers key of the RegExp that matched */
	key: Key;
	/** the match groups captured by the RegExp */
	matches: string[]
	/** the substring that matched the RegExp */
	token: string;
};