
/** Converts forward/back quote characters to " */
export function normalizeQuotes(text: string): string {
	/*// return text.replace(DOUBLE_REGEX, DOUBLE);*/
	return text.replace(/[\u201C\u201D]/g, `"`);
}
