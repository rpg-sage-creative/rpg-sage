import { regex } from "regex";
import { tokenize } from "../tokenize.js";
import { getCodeBlockRegex } from "./getCodeBlockRegex.js";

type Options = {
	/** how many parts to return */
	limit?: number;
};

/** @internal Does the heavy lifting of splitting a string while ignoring code blocks. */
export function codeBlockSafeSplit(value: string, splitter: string | RegExp, options?: Options): string[] {
	const { limit } = options ?? {};

	const tokenParsers = {
		three: getCodeBlockRegex(),
		splitter: typeof(splitter) === "string" ? regex`${splitter}` : splitter
	};
	const tokens = tokenize(value, tokenParsers);

	const lines = [""];
	let lineIndex = 0;

	for (const { key, token } of tokens) {
		switch(key) {
			case "splitter":
				// increment lineIndex, add empty string
				lineIndex = lines.push("") - 1;
				break;

			default:
				// append token to the current line
				lines[lineIndex] += token;
				break;
		}
	}

	return lines.slice(0, limit);
}