
/** Converts m-dash and n-dash characters to - */
export function normalizeDashes(text: string): string {
	/*// const DASH = "\u002D", NDASH = "\u2013", MDASH = "\u2014";*/
	return text.replace(/[\u2013\u2014]/g, `-`);
}
