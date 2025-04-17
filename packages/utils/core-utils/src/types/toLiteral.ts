import { isDate } from "util/types";

/**
 * Returns the given value as it would look in code.
 * This function is designed to facilitate displaying values in test output.
 *
 * Strings have quotes around them.
 * RegExp looks like /value/i.
 * BigInts have an "n": 123n.
 * Objects/Arrays are stringified.
 * Null is null.
 * Undefined is undefined.
 */
export function toLiteral(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (value) {
		if (Array.isArray(value)) {
			return `[${value.map(toLiteral).join(",")}]`;
		}
		if (isDate(value)) {
			return `Date("${value.toISOString()}")`;
		}
		if (value instanceof Map) {
			return `Map(${toLiteral([...value.entries()])})`;
		}
		if (value instanceof RegExp) {
			return `/${value.source}/${value.flags}`;
		}
		if (value instanceof Set) {
			return `Set(${toLiteral([...value.values()])})`;
		}
	}
	switch (typeof(value)) {
		case "bigint":
			return `${value}n`;

		case "object":
			/**
			 * @todo we should be able to make use of stringifyJson(vaue, (key, value) => toLiteral)
			 * ...
			 * but the following works and I don't wanna rabbit hole.
			 */
			const entries = [...Object.entries(value as any)];
			const mapped = entries.map(([key, val]) => `${toLiteral(key)}:${toLiteral(val)}`);
			return `{${mapped.join(",")}}`;

		case "string":
			// we use stringify to let it escape special characters
			return JSON.stringify(value);

		default:
			return String(value);
	}
}