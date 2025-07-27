/**
 * @internal
 * Reduces all whitespace to a single space ( ) and trims.
 */
export function cleanWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}
