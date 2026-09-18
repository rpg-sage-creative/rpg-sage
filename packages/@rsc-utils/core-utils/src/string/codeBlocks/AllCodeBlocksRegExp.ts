import type { TypedRegExp } from "@rsc-utils/type-utils";
import { regex } from "regex";
import { globalizeRegex } from "../../regex/globalizeRegex.js";

export type CodeBlockRegexGroups = {
	ticks: string;
	content: string;
};

/**
 * Matches code blocks with 1, 2, or 3 ticks.
 * Intended for reuse with .test() or as a TokenParser.
 * If 3 ticks, then single or double ticks and new lines are allowed in the content.
 * If 2 ticks, then single ticks are allowed in the content, but not new lines.
 * If 1 tick, then no ticks and no new lines are allowed in the content.
*/
export const AllCodeBlocksRegExp = regex()`
	(
		(?<ticks> ((?<!\\)${"`"}){3} )
		(?<content> (.|\n)*? )
		((?<!\\)${"`"}){3}
	)
	|
	(
		(?<ticks> ((?<!\\)${"`"}){2} )
		(?<content> .*? )
		((?<!\\)${"`"}){2}
	)
	|
	(
		(?<ticks> ((?<!\\)${"`"}){1} )
		(?<content> .*? )
		((?<!\\)${"`"}){1}
	)
` as TypedRegExp<CodeBlockRegexGroups>;

/**
 * AllCodeBlocksRegExp with the global flag.
 * Intended for use with string.match(), string.matchAll(), and string.replace().
*/
export const AllCodeBlocksRegExpG = globalizeRegex(AllCodeBlocksRegExp);
