import { normalizeAscii } from "../StringUtils";

function cleanWhitespaceIfShort(value: string, maxLineLength: number): string {
	return value.length > maxLineLength
		? value
		: value.replace(/\s+/g, " ");
}

function normalizeValueIfString<T extends any = string>(value: T): T {
	if (typeof(value) === "string") {
		return normalizeAscii(value) as T;
	}
	return value;

}

function inlineCurlyBraces(value: string, maxLineLength: number): string {
	return value.replace(/\{[^\{]*?\}/g, match => cleanWhitespaceIfShort(match, maxLineLength));
}

function inlineSquareBrackets(value: string, maxLineLength: number): string {
	return value.replace(/\[[\w",\s-\.]*?\]/g, match => cleanWhitespaceIfShort(match, maxLineLength));
}

/** Formats JSON as readable, while trying to keep {} or [] on a single line <= 250 characters. */
export function formattedStringify<T>(object: T): string;
/** Formats JSON as readable, while trying to keep {} or [] on a single line <= maxLineLength characters. */
export function formattedStringify<T>(object: T, maxLineLength: number): string;
export function formattedStringify<T>(object: T, maxLineLength = 250): string {
	const stringified = JSON.stringify(object, (_, value: string) => normalizeValueIfString(value), "\t");
	return inlineCurlyBraces(inlineSquareBrackets(stringified, maxLineLength), maxLineLength);
}
