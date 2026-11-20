import { isDate } from "node:util/types";

/**
 * @internal Checks that the value is an object whose reference identity survives encoding.
 * Dates and boxed primitives serialize by value, so they are excluded; null's type is "object", so it is excluded too.
 * encodeJson registers only these as { $ref } targets, and decodeJson detects wrappers among them — the invariant holds on both sides.
 */
export function isNonNullEncodableObject(value: unknown): boolean {
	return value !== null
		&& typeof(value) === "object"
		&& !isDate(value)
		&& !(
			value instanceof String
			|| value instanceof Number
			|| value instanceof Boolean
		);
}
