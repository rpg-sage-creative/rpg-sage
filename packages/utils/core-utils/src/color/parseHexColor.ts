import type { Optional } from "../types/generics.js";
import type { HexColorString } from "./ColorData.js";
import { matchHex } from "./internal/matchHex.js";

/** Parses the value to get a Hex value, include alpha if present: #002244FF */
export function parseHexColor(value: Optional<string>): HexColorString | undefined;

/** Parses the value to get a full Hex value with alpha: #002244FF */
export function parseHexColor(value: Optional<string>, includeAlpha: true): HexColorString | undefined;

/** Parses the value to get a Hex value with NO alpha: #002244 */
export function parseHexColor(value: Optional<string>, includeAlpha: false): HexColorString | undefined;

export function parseHexColor(value: Optional<string>, includeAlpha?: boolean): HexColorString | undefined {
	const match = matchHex(value);
	if (!match) return undefined; // NOSONAR


	let hex = match.digits.toLowerCase();
	if (hex.length < 5) {
		hex = [...hex].map(d => d + d).join("");
	}

	if (includeAlpha === true) {
		hex = hex.padEnd(8, "f");

	}else if (includeAlpha === false) {
		hex = hex.slice(0, 6);
	}

	return `#${hex}`;
}