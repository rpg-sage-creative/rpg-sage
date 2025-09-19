import type { TypedRegExpStringIterator } from "../../types/generics.js";
import { getCodeBlockRegex } from "./getCodeBlockRegex.js";

type CodeBlockMatch = {
	index: number;
	length: number;
	match: string;
	ticks: string;
	content: string;
};

type MatchGroups = {
	ticks1: string;
	content1: string;
}|{
	ticks2: string;
	content2: string;
}|{
	ticks3: string;
	content3: string;
};

/**
 * @internal Finds all the matches in a given string
 */
export function matchCodeBlocks(content: string): CodeBlockMatch[] {
	const matches: CodeBlockMatch[] = [];

	const iterator = content.matchAll(getCodeBlockRegex({ gFlag:"g" })) as TypedRegExpStringIterator<MatchGroups>;
	for (const execArray of iterator) {
		const { index, 0:match, groups } = execArray;
		const ticks = groups.ticks1 ?? groups.ticks2 ?? groups.ticks3;
		const content = groups.content1 ?? groups.content2 ?? groups.content3;
		matches.push({ index, length:match.length, match, ticks, content });
	}

	return matches;
}