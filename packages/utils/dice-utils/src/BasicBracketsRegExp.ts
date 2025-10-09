/*
	RegExp to match [[...]] or [...]

	Possible Future option: allow escaping slashes (?<!\\)
*/

/** Matches [[...]] or [...]. Used for .test(string) and in tokenizers. */
export const BasicBracketsRegExp = /\[{2}[^\[\]]+\]{2}|\[[^\[\]]+\]/i;

/** Matches [[...]] or [...]. Used for string.match(), string.matchAll(), and string.replace(). */
export const BasicBracketsRegExpG = /\[{2}[^\[\]]+\]{2}|\[[^\[\]]+\]/ig;

/** Creates a unique BasicBracketsRegExpG regular expression. Used when you need to respect .lastIndex. */
export function createBasicBracketsRegExpG(): RegExp {
	return /\[{2}[^\[\]]+\]{2}|\[[^\[\]]+\]/ig;
}