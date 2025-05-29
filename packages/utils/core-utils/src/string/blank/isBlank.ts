/** Returns true if null, undefined, or only whitespace. */
export function isBlank(value: null | undefined | string): value is null | undefined | "" {
	return !value?.trim().length;
}
