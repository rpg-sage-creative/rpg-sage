import { normalizeApostrophes } from "./normalizeApostrophes.js";
import { normalizeDashes } from "./normalizeDashes.js";
import { normalizeEllipses } from "./normalizeEllipses.js";
import { normalizeQuotes } from "./normalizeQuotes.js";

/** Convenience for normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(value)))) */
export function normalizeAscii(text: string): string {
	return normalizeApostrophes(normalizeDashes(normalizeEllipses(normalizeQuotes(text))));
}
