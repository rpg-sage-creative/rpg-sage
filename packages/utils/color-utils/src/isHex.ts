import type { Optional } from "./internal/Optional.js";
import { matchHex } from "./internal/matchHex.js";

/** Tests for HEX or HEXA */
export function isHex(color: Optional<string>): boolean;

/** Tests explicitly for HEXA (WITH alpha) */
export function isHex(color: Optional<string>, withAlpha: true): boolean;

/** Tests explicitly for HEX (WITHOUT alpha) */
export function isHex(color: Optional<string>, withAlpha: false): boolean;

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
