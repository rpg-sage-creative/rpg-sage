import { pattern, regex } from "regex";
import { matchCodeBlocks } from "./matchCodeBlocks.js";

/** @internal Does the heavy lifting of splitting a string while ignoring code blocks. */
export function codeBlockSafeSplit(value: string, splitter: string | RegExp, limit?: number): string[] {
	const lines: string[] = [];
	const testLimit = limit !== undefined;
	const codeBlocks = matchCodeBlocks(value);
	const source = typeof(splitter) === "string" ? splitter : pattern(splitter.source);
	const regexp = regex("g")`${source}`;
	let index = -1;
	let lastIndex = 0;
	do {
		do {
			// look for the next newLine
			index = regexp.exec(value)?.index ?? -1;
		// any newLine inside a codeBlock needs to be ignored
		}while (-1 < index && codeBlocks.find(codeBlock => codeBlock.index < index && index < codeBlock.index + codeBlock.length));

		if (-1 < index) {
			// we found a newLine ... add a new line
			lines.push(value.slice(lastIndex, index));
			lastIndex = index + 1;

		}else {
			// we didn't find a newLine ... add the last line
			lines.push(value.slice(lastIndex));
		}

		// if we have a limit and reached it, exit early
		if (testLimit && lines.length === limit) {
			break;
		}

	// we keep looping till we don't find a newLine
	}while (-1 < index);

	return lines;
}