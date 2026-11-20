import { encodeJson } from "./encodeJson.js";

// @todo look into this: https://www.npmjs.com/package/json-beautify

const WhitespaceRegExpG = /\s+/g;

function cleanWhitespaceIfShort(value: string, maxLineLength: number): string {
	return value.length > maxLineLength
		? value
		: value.replace(WhitespaceRegExpG, " ").trim();
}

const CurlyBracesRegExpG = /\{[^{[]*?\}/g;

function inlineCurlyBraces(value: string, maxLineLength: number): string {
	return value.replace(CurlyBracesRegExpG, match => cleanWhitespaceIfShort(match, maxLineLength));
}

const SquareBracketsRegExpG = /\[((,\s*)?)("[^"]*"|[\w",\s-.])*?\]/g;

function inlineSquareBrackets(value: string, maxLineLength: number): string {
	return value.replace(SquareBracketsRegExpG, match => cleanWhitespaceIfShort(match, maxLineLength));
}

/**
 * Encodes the value with encodeJson and collapses short lines when maxLineLength is given.
 * A falsy space is forced to "\t", matching the deprecated stringifyJson path; replacer and space are forwarded so callers migrating from stringifyJson keep identical output.
 */
export function prettifyJson(value: any, maxLineLength = 0, replacer?: Function | (string | number)[] | null, space?: string | number): string {
	const stringified = encodeJson(value, replacer as never, space || "\t");
	return maxLineLength > 0 && stringified
		? inlineCurlyBraces(inlineSquareBrackets(stringified, maxLineLength), maxLineLength)
		: stringified;
}
