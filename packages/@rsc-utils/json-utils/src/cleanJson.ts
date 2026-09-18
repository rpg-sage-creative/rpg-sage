import { isPrimitive } from "@rsc-utils/type-utils";

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
type TObject = Record<string, any>;

//#endregion

//#region helpers

/** Checks the rules to see if the value given can have its key deleted. */
function canDeleteValueKey(value: bigint | boolean | number | string, rules: JsonCleanRules | true): boolean {
	const testKey = (key: keyof JsonCleanRules) => rules === true || rules[key] === true;
	if (value === undefined) {
		return testKey("deleteUndefined");

	}else if (value === null) {
		return testKey("deleteNull");

	}else if (value === false) {
		return testKey("deleteFalse");

	}else if (value === 0 || value === 0n) {
		return testKey("deleteZero");

	}else if (typeof(value) === "number" && isNaN(value as number)) {
		return testKey("deleteNaN");

	}else if (typeof(value) === "string") {
		if (value === "" && testKey("deleteEmptyString")) return true;
		if (value.trim() === "" && testKey("deleteBlankString")) return true;

	}
	return false;
}

//#endregion

/** Cleans the JSON using the minimum rules (delete keys that have "undefined" values). */
export function cleanJson<T>(value: T): T;
/** Cleans the JSON using the maximum rules (delete keys that have "falsey" values or are empty arrays or empty objects). */
export function cleanJson<T>(value: T, rules: "scrub"): T;
/** Cleans the JSON using the given rules. */
export function cleanJson<T>(value: T, rules: JsonCleanRules): T;
export function cleanJson<T>(value: T, rulesOrScrub?: JsonCleanRules | "scrub"): T {
	// We don't clean primitive values
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
