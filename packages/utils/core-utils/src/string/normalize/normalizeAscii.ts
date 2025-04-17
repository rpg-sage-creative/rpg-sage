import { normalizeApostrophes } from "./normalizeApostrophes.js";
import { normalizeDashes } from "./normalizeDashes.js";
import { normalizeEllipses } from "./normalizeEllipses.js";
import { normalizeQuotes } from "./normalizeQuotes.js";

type Options = {
	apostrophes?: boolean;
	dashes?: boolean;
	ellipses?: boolean;
	quotes?: boolean;
};

/** Convenience for normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(value)))) */
export function normalizeAscii(text: string, options?: Options): string {
	if (text) {
		const { apostrophes = true, dashes = true, ellipses = true, quotes = true } = options ?? {};
		if (apostrophes) {
			text = normalizeApostrophes(text);
		}
		if (dashes) {
			text = normalizeDashes(text);
		}
		if (ellipses) {
			text = normalizeEllipses(text);
		}
		if (quotes) {
			text = normalizeQuotes(text);
		}
	}
	return text;
}
