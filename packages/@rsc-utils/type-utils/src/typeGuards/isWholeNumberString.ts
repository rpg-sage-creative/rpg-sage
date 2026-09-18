const WholeNumberRegExp = /^\d+$/;

/** Returns true if the value is a string of only numbers. */
export function isWholeNumberString(value: unknown): value is `${number}` {
	return typeof(value) === "string" && WholeNumberRegExp.test(value);
}