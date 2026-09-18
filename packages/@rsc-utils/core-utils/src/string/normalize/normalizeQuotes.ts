const QuotesRegExp = /[\u201C\u201D]/g;

/** Converts forward/back quote characters to " */
export function normalizeQuotes(text: string): string {
	return text.replace(QuotesRegExp, `"`);
}
