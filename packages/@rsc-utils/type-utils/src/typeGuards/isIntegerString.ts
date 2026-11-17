/**
 * Regular Expression to match an anchored whole number (+/- optional):
 * /^[\-+]?\d+$/
 */
export const IntegerStringRegExp = /^[\-+]?\d+$/;

/** Returns true if the value is a string representation of a whole number (+/- optional). */
export function isIntegerString(value: unknown): value is `${"-"|"+"|""}${number}` {
	return typeof(value) === "string" && IntegerStringRegExp.test(value);
}