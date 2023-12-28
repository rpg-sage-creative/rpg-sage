import { matchCodeBlocks } from "./internal/matchCodeBlocks";

export function tokenize(content: string, parsers: RegExp): [] {
	//match redacted blocks
	const matches = matchCodeBlocks(content);
	//split the content around the redacted blocks
	matches;
	//tokenize the non-redacted blocks
	parsers;
	return [];
}