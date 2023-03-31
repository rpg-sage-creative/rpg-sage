
/** Converts forward/back apostrophe characters to ' */
export function normalizeApostrophes(text: string): string {
	/*// return text.replace(SINGLE_REGEX, SINGLE);*/
	return text.replace(/[\u2018\u2019]/g, `'`);
}

/** Converts m-dash and n-dash characters to - */
export function normalizeDashes(text: string): string {
	/*// const DASH = "\u002D", NDASH = "\u2013", MDASH = "\u2014";*/
	return text.replace(/[\u2013\u2014]/g, `-`);
}

/** Converts ellipses character to ... */
export function normalizeEllipses(text: string): string {
	return text.replace(/[\u2026]/g, `...`);
}

/** Converts forward/back quote characters to " */
export function normalizeQuotes(text: string): string {
	/*// return text.replace(DOUBLE_REGEX, DOUBLE);*/
	return text.replace(/[\u201C\u201D]/g, `"`);
}

/** Convenience for normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(value)))) */
export function normalizeAscii(text: string): string {
	return normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(text))));
}

/** Removes accents from letters. Ex: "à" becomes "a" */
export function removeAccents(value: string): string {
	return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
