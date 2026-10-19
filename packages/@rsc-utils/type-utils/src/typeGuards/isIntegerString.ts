/**
 * Regular Expression to match a whole number (+/- optional):
 * /[\-+]?\d+/
 */
export const IntegerRegExp = /[\-+]?\d+/;

/** Returns true if the value is a string representation of a whole number (+/- optional). */
export function isIntegerString(value: unknown): value is `${"-"|"+"|""}${number}` {
	if (typeof(value) !== "string") return false;
	const match = IntegerRegExp.exec(value);
	return match?.index === 0 && match[0].length === value.length;
}