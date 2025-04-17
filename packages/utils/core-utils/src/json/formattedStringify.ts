import { isNullOrUndefined } from "../types/index.js";
import { stringifyJson } from "./stringifyJson.js";

function cleanWhitespaceIfShort(value: string, maxLineLength: number): string {
	return value.length > maxLineLength ? value : value.replace(/\s+/g, " ");
}

function inlineCurlyBraces(value: string, maxLineLength: number): string {
	return value.replace(/\{[^{[]*?\}/g, match => cleanWhitespaceIfShort(match, maxLineLength));
}

function inlineSquareBrackets(value: string, maxLineLength: number): string {
	return value.replace(/\[((,\s*)?)("[^"]*"|[\w",\s-.])*?\]/g, match => cleanWhitespaceIfShort(match, maxLineLength));
}

type Options = {
	insertSpaces?: boolean;
	maxLineLength?: number;
	tabSize?: number;
};

/**
 * Formats JSON as readable, while trying to keep {} or [] on a single line.
 * Default maxLineLength is 250.
 * Default spacer is a tab "\t".
 * If insertSpaces is true, the default tabSize is 4.
 */
export function formattedStringify<T>(object: T, options: Options = {}): string {
	if (isNullOrUndefined(object)) {
		return String(object);
	}

	const tab = options?.insertSpaces ? "".padEnd(options.tabSize ?? 4, " ") : "\t";
	const stringified = stringifyJson(object, null, tab);

	const { maxLineLength = 250 } = options;
	return inlineCurlyBraces(inlineSquareBrackets(stringified, maxLineLength), maxLineLength);
}
