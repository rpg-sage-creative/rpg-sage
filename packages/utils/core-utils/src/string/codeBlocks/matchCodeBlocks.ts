import { AllCodeBlocksRegExpG } from "./AllCodeBlocksRegExp.js";

type CodeBlockMatch = {
	index: number;
	length: number;
	match: string;
	ticks: string;
	content: string;
};

/**
 * @internal Finds all the matches in a given string
 */
export function matchCodeBlocks(content: string): CodeBlockMatch[] {
	const matches: CodeBlockMatch[] = [];

	const iterator = content.matchAll(AllCodeBlocksRegExpG);
	for (const execArray of iterator) {
		const { index, 0:match, groups: { ticks, content} } = execArray;
		matches.push({ index, length:match.length, match, ticks, content });
	}

	return matches;
}