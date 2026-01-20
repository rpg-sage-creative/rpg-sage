import { globalizeRegex } from "@rsc-utils/core-utils";
import { regex } from "regex";

/*
	RegExp to match [[...]] or [...]

	Possible Future option: allow escaping slashes (?<!\\)
*/

/** Matches [[...]] or [...]. Used for .test(string) and in tokenizers. */
export const BasicBracketsRegExp = regex("i")`
	# double brackets
	\[{2}
	[^ \[ \] ]+
	\]{2}

	|

	# single brackets
	\[
	[^ \[ \] ]+
	\]
`;

/** Matches [[...]] or [...]. Used for string.match(), string.matchAll(), and string.replace(). */
export const BasicBracketsRegExpG = globalizeRegex(BasicBracketsRegExp);

/** Creates a unique BasicBracketsRegExpG regular expression. Used when you need to respect .lastIndex. */
export function createBasicBracketsRegExpG(): RegExp {
	return globalizeRegex(BasicBracketsRegExp);
}