const SimpleNumberRegExp = /^\d+$/;

/** Returns true if the value is a string of only numeric digits. */
export function isSimpleNumberString(value: unknown): value is `${number}` {
	return typeof(value) === "string" && SimpleNumberRegExp.test(value);
}