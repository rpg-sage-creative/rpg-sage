
/** Reduces multiple whitespace characteres to a single space, then trims the string. */
export function cleanWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

/** Convenience for creating/sharing whitespace regex in case we change it later. */
export function createWhitespaceRegex(globalFlag = false): RegExp {
	return globalFlag ? /\s+/ : /\s+/g;
}
