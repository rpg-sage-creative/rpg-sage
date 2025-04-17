/** Returns true if null, undefined, or only whitespace. */
export function isBlank(text: null | undefined | string): text is null | undefined | "" {
	return !text?.trim().length;
}
