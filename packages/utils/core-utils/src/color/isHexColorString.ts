import type { Optional } from "../types/generics.js";
import type { HexColorString } from "./ColorData.js";
import { matchHex } from "./internal/matchHex.js";

/** Tests for HEX or HEXA */
export function isHexColorString(color: Optional<string>): color is HexColorString;

/** Tests explicitly for HEXA (WITH alpha) */
export function isHexColorString(color: Optional<string>, withAlpha: true): color is HexColorString;

/** Tests explicitly for HEX (WITHOUT alpha) */
export function isHexColorString(color: Optional<string>, withAlpha: false): color is HexColorString;

export function isHexColorString(color: Optional<string>, withAlpha?: boolean): boolean {
	const match = matchHex(color);
	if (!match) return false; // NOSONAR

	if (withAlpha === true) {
		return match.hasAlpha;

	}else if (withAlpha === false) {
		return !match.hasAlpha;
	}

	return true;
}
