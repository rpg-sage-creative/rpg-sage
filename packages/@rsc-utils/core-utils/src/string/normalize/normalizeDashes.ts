/** DASH = "\u002D", NDASH = "\u2013", MDASH = "\u2014" */
const DashesRegExp = /[\u2013\u2014]/g;

/** Converts m-dash and n-dash characters to - */
export function normalizeDashes(text: string): string {
	return text.replace(DashesRegExp, `-`);
}
