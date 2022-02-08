
//#region cleanJson

import type { IJsonCleanRules } from "./types";

const PrimitiveTypes = ["number", "string", "boolean"];
const DefaultJsonCleanRules: IJsonCleanRules = {
	deleteUndefined: true
};

function isPrimitive<T>(object: T): boolean {
	return object === null
		|| object === undefined
		|| object instanceof Date
		|| PrimitiveTypes.includes(typeof(object));
}

export function cleanJson<T>(value: T): T;
export function cleanJson<T>(value: T, rules: IJsonCleanRules): T;
export function cleanJson<T>(value: T, rules = DefaultJsonCleanRules): T {
	if (isPrimitive(value)) {
		return value;
	}
	if (Array.isArray(value)) {
		if (value.length && rules.recursive) {
			value.forEach(v => cleanJson(v, rules));
		}
		return value;
	}
	cleanObject(value, rules);
	return value;
}

function canDeleteValueKey(value: boolean | number | string, rules: IJsonCleanRules): boolean {
	return value === undefined && rules.deleteUndefined === true
		|| value === null && rules.deleteNull === true
		|| value === "" && rules.deleteEmptyString === true
		|| value === false && rules.deleteFalse === true
		|| value === 0 && rules.deleteZero === true;
}

type TObject = { [key: string]: any; };
function cleanObject(object: TObject, rules: IJsonCleanRules): void {
	Object.keys(object).forEach(key => {
		const value = object[key];
		if (canDeleteValueKey(value, rules)) {
			delete object[key];

		}else if (Array.isArray(value)) {
			if (value.length) {
				if (rules.recursive) {
					value.forEach(v => cleanJson(v, rules));
				}
			}else if (rules.deleteEmptyArray) {
				delete object[key];
			}

		}else if (String(value) === "[object Object]") {
			if (rules.recursive) {
				cleanJson(value, rules);
			}
			if (rules.deleteEmptyObject && Object.keys(value).length === 0) {
				delete object[key];
			}
		}
	});
}

//#endregion

//#region formattedStringify

import { normalizeAscii } from "../StringUtils";

const MAX_LINE_LENGTH = 250;

function cleanWhitespaceIfShort(value: string): string {
	return value.length > MAX_LINE_LENGTH
		? value
		: value.replace(/\s+/g, " ");
}

function normalizeValueIfString<T extends any = string>(value: T): T {
	if (typeof(value) === "string") {
		return normalizeAscii(value) as T;
	}
	return value;

}

function inlineCurlyBraces(value: string): string {
	return value.replace(/\{[^\{]*?\}/g, cleanWhitespaceIfShort);
}

function inlineSquareBrackets(value: string): string {
	return value.replace(/\[[\w",\s-]*?\]/g, cleanWhitespaceIfShort);
}

/** Formats JSON as readable, while trying to keep {} or [] on a single line where <= 250 characters. */
export function formattedStringify<T>(object: T): string {
	const stringified = JSON.stringify(object, (_, value: string) => normalizeValueIfString(value), "\t");
	return inlineCurlyBraces(inlineSquareBrackets(stringified));
}

//#endregion
