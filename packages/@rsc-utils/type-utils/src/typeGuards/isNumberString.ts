
/**
 * Regular Expression to match a (whole or decimal) number (+/- optional):
 * /[\-\+]?\d+(?:\.\d+)?/
 */
export const NumberRegExp = /[\-\+]?\d+(?:\.\d+)?/;

/** Returns true if the value is a string representation of a (whole or decimal) number (+/- optional). */
export function isNumberString(value: unknown): value is `${"-"|"+"|""}${number}` {
	if (typeof(value) !== "string") return false;
	const match = NumberRegExp.exec(value);
	return match?.index === 0 && match[0].length === value.length;
}