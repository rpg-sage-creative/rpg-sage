
/**
 * Regular Expression to match a (whole or decimal) number (+/- optional):
 * /[\-\+]?\d+(?:\.\d+)?/
 */
export const NumberRegExp = /[\-\+]?\d+(?:\.\d+)?/;

/**
 * Regular Expression to match an anchored number (whole or decimal; +/- optional):
 * /^[\-\+]?\d+(?:\.\d+)?$/
 */
const NumberStringRegExp = /^[\-\+]?\d+(?:\.\d+)?$/;

/** Returns true if the value is a string representation of a (whole or decimal) number (+/- optional). */
export function isNumberString(value: unknown): value is `${"-"|"+"|""}${number}` {
	return typeof(value) === "string" && NumberStringRegExp.test(value);
}