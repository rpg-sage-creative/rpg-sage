import { regex } from "regex";
import type { TypedRegExp } from "../../types/TypedRegExp.js";

export type CodeBlockRegexGroups = {
	ticks: string;
	content: string;
};

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

export const AllCodeBlocksRegExpG = new RegExp(AllCodeBlocksRegExp, "g") as TypedRegExp<CodeBlockRegexGroups>;

export function getAllCodeBlocksRegExpG(): TypedRegExp<CodeBlockRegexGroups> {
	return new RegExp(AllCodeBlocksRegExp, "g") as TypedRegExp<CodeBlockRegexGroups>;
}