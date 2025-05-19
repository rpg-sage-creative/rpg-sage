import { isDate } from "util/types";


export type Options = {
	/** key paths to match for displaying "..." instead of content */
	ellipses?: string[];
}

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
export function toLiteral(value: unknown, options?: Options): string;
/** @internal */
export function toLiteral(value: unknown, options?: Options, keyPath?: string[]): string;
export function toLiteral(value: unknown, options?: Options, keyPath: string[] = []): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (value) {
		if (Array.isArray(value)) {
			if (options?.ellipses?.includes(keyPath.join("."))) {
				return `[...]`;
			}
			return `[${value.map((value, i) => toLiteral(value, options, keyPath.concat([`${i}`]))).join(",")}]`;
		}
		if (isDate(value)) {
			return `Date("${value.toISOString()}")`;
		}
		if (value instanceof Map) {
			if (options?.ellipses?.includes(keyPath.join("."))) {
				return `Map([...])`;
			}
			return `Map(${toLiteral([...value.entries()])})`;
		}
		if (value instanceof RegExp) {
			return `/${value.source}/${value.flags}`;
		}
		if (value instanceof Set) {
			if (options?.ellipses?.includes(keyPath.join("."))) {
				return `Set([...])`;
			}
			return `Set(${toLiteral([...value.values()])})`;
		}
	}
	switch (typeof(value)) {
		case "bigint":
			return `${value}n`;

		case "object":
			if (options?.ellipses?.includes(keyPath.join("."))) {
				return `{...}`;
			}
			/**
			 * @todo we should be able to make use of stringifyJson(vaue, (key, value) => toLiteral)
			 * ...
			 * but the following works and I don't wanna rabbit hole.
			 */
			const entries = [...Object.entries(value as any)];
			const mapped = entries.map(([key, val]) => `${toLiteral(key)}:${toLiteral(val, options, keyPath.concat([key]))}`);
			return `{${mapped.join(",")}}`;

		case "string":
			// we use stringify to let it escape special characters
			return JSON.stringify(value);

		default:
			return String(value);
	}
}
