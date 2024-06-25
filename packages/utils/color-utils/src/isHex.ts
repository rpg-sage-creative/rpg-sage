import type { HexColorString } from "./ColorData.js";
import type { Optional } from "./internal/Optional.js";
import { matchHex } from "./internal/matchHex.js";

/** Tests for HEX or HEXA */
export function isHex(color: Optional<string>): color is HexColorString;

/** Tests explicitly for HEXA (WITH alpha) */
export function isHex(color: Optional<string>, withAlpha: true): color is HexColorString;

/** Tests explicitly for HEX (WITHOUT alpha) */
export function isHex(color: Optional<string>, withAlpha: false): color is HexColorString;

export function isHex(color: Optional<string>, withAlpha?: boolean): boolean {
	const match = matchHex(color);
	if (match) {
		if (withAlpha === true) {
			return match[2] !== undefined;
		}
		if (withAlpha === false) {
			return match[2] === undefined;
		}
		return true;
	}
	return false;
}
