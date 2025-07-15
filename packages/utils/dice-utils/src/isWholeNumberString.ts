let wholeNumberRegex: RegExp;

/** Returns true if the value is a string of only numbers. */
export function isWholeNumberString(value: unknown): value is `${number}` {
	if (typeof(value) === "string") {
		wholeNumberRegex ??= /^\d+$/;
		return wholeNumberRegex.test(value);
	}
	return false;
}