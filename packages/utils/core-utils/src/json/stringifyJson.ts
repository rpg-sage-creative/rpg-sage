import { isDate } from "util/types";

/**
 * BigInt and Date friendly replacement for JSON.stringify().
 */
export function stringifyJson(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;

export function stringifyJson(value: any, replacer?: (string | number)[] | null, space?: string | number): string;

export function stringifyJson(value: any, replacer?: Function | (string | number)[] | null, space?: string | number): string {
	return JSON.stringify(value, function(this: any, key: string, value: any) {
		// we are handling bigint and date values
		const cleanValue = this[key];
		if (isDate(cleanValue)) return { $date:cleanValue.toISOString() };
		if (typeof(cleanValue) === "bigint") return { $bigint:cleanValue.toString() };

		// if they passed in a replacer, then let's use it
		if (replacer) {
			// call a function
			if (typeof(replacer) === "function") {
				return replacer.call(this, key, value);

			// check an array to ensure the key was given
			}else if (Array.isArray(replacer) && !replacer.some(_key => String(_key) === key)) {
				return undefined;
			}
		}

		return value;
	}, space);
}

/** @deprecated use stringifyJson() */
export const stringify = stringifyJson;
