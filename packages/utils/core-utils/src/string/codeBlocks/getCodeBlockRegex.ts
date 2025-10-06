import { getOrCreateRegex } from "../../regex/getOrCreateRegex.js";
import type { RegExpFlagOptions } from "../../regex/RegExpOptions.js";

export type CodeBlockRegexGroups = {
	ticks1: string;
	content1: string;
}|{
	ticks2: string;
	content2: string;
}|{
	ticks3: string;
	content3: string;
};

type GetOptions = RegExpFlagOptions & { ticks?:1|2|3; };

function createSource(ticks: 1 | 2 | 3): string {
	// we only include new lines when 3 ticks are used
	const content = ticks === 3 ? `(?:.|\n)` : `.`;
	return `(?<ticks${ticks}>(?:(?<!\\\\)\`){${ticks}})(?<content${ticks}>${content}*?)(?:(?:(?<!\\\\)\`){${ticks}})`;
}

function createCodeBlockRegex({ gFlag = "", iFlag = "", ticks }: GetOptions = {}): RegExp {
	if (ticks) {
		return new RegExp(createSource(ticks), gFlag + iFlag);
	}
	const sources = [
		createSource(3),
		createSource(2),
		createSource(1)
	];
	return new RegExp(`(?:${sources.join("|")})`, gFlag + iFlag);
}

export function getCodeBlockRegex(options?: GetOptions) {
	return getOrCreateRegex(createCodeBlockRegex, options);
}