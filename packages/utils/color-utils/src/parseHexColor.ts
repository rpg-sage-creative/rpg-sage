import { matchHex } from "./internal/matchHex.js";

/** Parses the value to get a Hex value, include alpha if present: #002244FF */
export function parseHexColor(value: string): string | null;

/** Parses the value to get a full Hex value with alpha: #002244FF */
export function parseHexColor(value: string, includeAlpha: true): string | null;

/** Parses the value to get a Hex value with NO alpha: #002244FF */
export function parseHexColor(value: string, includeAlpha: false): string | null;

export function parseHexColor(value: string, includeAlpha?: boolean): string | null {
	const match = matchHex(value);
	if (!match) {
		return null;
	}
	let hex = match[1];
	if (hex.length === 3) {
		hex = hex[0] + hex[0] +hex[1] + hex[1] +hex[2] + hex[2];
	}
	if (includeAlpha === false) {
		return `#${hex}`;
	}
	let alpha = match[2] ?? (includeAlpha ? "FF" : "");
	if (alpha.length === 1) {
		alpha = alpha + alpha;
	}
	return `#${hex}${alpha}`;
}