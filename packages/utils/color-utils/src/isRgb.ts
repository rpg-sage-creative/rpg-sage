import type { Optional } from "./internal/Optional.js";
import { matchRgb } from "./internal/matchRgb.js";

/** Tests for RGB or RGBA */
export function isRgb(color: Optional<string>): boolean;

/** Tests explicitly for RGBA (WITH alpha) */
export function isRgb(color: Optional<string>, withAlpha: true): boolean;

/** Tests explicitly for RGB (WITHOUT alpha) */
export function isRgb(color: Optional<string>, withAlpha: false): boolean;

export function isRgb(color: Optional<string>, withAlpha?: boolean): boolean {
	const match = matchRgb(color);
	if (match) {
		if (withAlpha === true) {
			return match[4] !== undefined;
		}
		if (withAlpha === false) {
			return match[4] === undefined;
		}
		return true;
	}
	return false;
}
