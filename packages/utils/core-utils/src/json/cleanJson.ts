import { isPrimitive } from "../types/typeGuards/isPrimitive.js";

//#region types

/** Determines how the JSON is cleaned. */
export type JsonCleanRules = {
	deleteBlankString?: boolean;
	deleteEmptyArray?: boolean;
	deleteEmptyObject?: boolean;
	deleteEmptyString?: boolean;
	deleteFalse?: boolean;
	deleteNaN?: boolean;
	deleteNull?: boolean;
	deleteUndefined?: boolean;
	deleteZero?: boolean;
	recursive?: boolean;
};

/** Used to simplify casting objects to let us get key/values from them. */
type TObject = { [key: string]: any; };

//#endregion

//#region helpers

/** Checks the rules to see if the value given can have its key deleted. */
function canDeleteValueKey(value: boolean | number | string, rules: JsonCleanRules | true): boolean {
	return value === undefined && (rules === true || rules.deleteUndefined === true)
		|| value === null && (rules === true || rules.deleteNull === true)
		|| value === "" && (rules === true || rules.deleteEmptyString === true)
		|| value === false && (rules === true || rules.deleteFalse === true)
		|| value === 0 && (rules === true || rules.deleteZero === true)
		|| isNaN(value as number) && (rules === true || rules.deleteNaN === true)
		|| (typeof(value) === "string" && value.trim() === "") && (rules === true || rules.deleteBlankString === true)
		;
}

//#endregion

/** Cleans the JSON using the minimum rules (delete keys that have "undefined" values). */
export function cleanJson<T>(value: T): T;
/** Cleans the JSON using the maximum rules (delete keys that have "falsey" values or are empty arrays or empty objects). */
export function cleanJson<T>(value: T, rules: "scrub"): T;
/** Cleans the JSON using the given rules. */
export function cleanJson<T>(value: T, rules: JsonCleanRules): T;
export function cleanJson<T>(value: T, rulesOrScrub?: JsonCleanRules | "scrub"): T {
	// We clean primitive values
	if (isPrimitive(value)) {
		return value;
	}

	const rules = rulesOrScrub === "scrub" ? true : rulesOrScrub ?? { deleteUndefined: true };

	// If it is an array, we only clean it if the rules include recursion
	if (Array.isArray(value)) {
		if (value.length && (rules === true || rules.recursive)) {
			value.forEach(v => cleanJson(v, rulesOrScrub as JsonCleanRules));
		}
		return value;
	}

	cleanObject(value as TObject, rules);
	return value;
}

/** This is where the magic happens. */
function cleanObject(object: TObject, rules: JsonCleanRules | true): void {
	const keys = Object.keys(object);
	for (const key of keys) {
		const value = object[key];
		if (canDeleteValueKey(value, rules)) {
			delete object[key];

		}else if (Array.isArray(value)) {
			if (value.length) {
				if (rules === true || rules.recursive) {
					value.forEach(v => cleanJson(v, rules as JsonCleanRules));
				}
			}else if (rules === true || rules.deleteEmptyArray) {
				delete object[key];
			}

		}else if (String(value) === "[object Object]") {
			if (rules === true || rules.recursive) {
				cleanJson(value, rules as JsonCleanRules);
			}

			// We have cleaned the object, check to see if it is now empty
			if ((rules === true || rules.deleteEmptyObject) && Object.keys(value).length === 0) {
				delete object[key];
			}
		}
	}
}
