import { isDate } from "node:util/types";

// @todo look into this: https://github.com/moll/json-stringify-safe/blob/master/stringify.js
// @todo look into thos: https://www.npmjs.com/package/json-beautify

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
 * BigInt, Date, and non-finite-number friendly replacement for JSON.stringify().
 * Values JSON cannot represent are wrapped so parseJson can restore them: bigint to { $bigint }, Date to { $date }, and NaN/-0/±Infinity to { $number }.
 */
export function stringifyJson(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number, maxLineLength?: number): string;

export function stringifyJson(value: any, replacer?: (string | number)[] | null, space?: string | number, maxLineLength?: number): string;

export function stringifyJson(value: any, replacer?: Function | (string | number)[] | null, space?: string | number, maxLineLength = 0): string {
	// if we have a maxLineLength, we need to make sure we have "space" character(s)
	if (maxLineLength > 0 && !space) space = "\t";

	const stringified = JSON.stringify(value, function(this: any, key: string, value: any) {
		// we are handling bigint and date values
		const cleanValue = this[key];
		if (isDate(cleanValue)) return { $date:cleanValue.toISOString() };
		if (typeof(cleanValue) === "bigint") return { $bigint:cleanValue.toString() };

		// JSON cannot represent NaN, ±Infinity, or -0; wrap them so parseJson can restore them losslessly
		if (typeof(cleanValue) === "number") {
			if (!Number.isFinite(cleanValue)) return { $number:String(cleanValue) };
			if (Object.is(cleanValue, -0)) return { $number:"-0" };
		}

		// if they passed in a replacer, then let's use it
		if (replacer) {
			// call a function
			if (typeof(replacer) === "function") {
				return replacer.call(this, key, value);

			// check an array to ensure the key was given
			// key "" is JSON.stringify's sentinel for the root value, which must never be filtered out
			}else if (Array.isArray(replacer) && key !== "" && !replacer.some(_key => String(_key) === key)) {
				return undefined;
			}
		}

		return value;
	}, space);

	// if we have a maxLineLength, process the json
	if (maxLineLength > 0) {
		return inlineCurlyBraces(inlineSquareBrackets(stringified, maxLineLength), maxLineLength);
	}

	return stringified;
}
