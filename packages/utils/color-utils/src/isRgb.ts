import type { RgbaColorString, RgbColorString } from "./ColorData.js";
import type { Optional } from "./internal/Optional.js";
import { matchRgb } from "./internal/matchRgb.js";

/** Tests for RGB or RGBA */
export function isRgb(color: Optional<string>): color is RgbColorString | RgbaColorString;

/** Tests explicitly for RGBA (WITH alpha) */
export function isRgb(color: Optional<string>, withAlpha: true): color is RgbaColorString;

/** Tests explicitly for RGB (WITHOUT alpha) */
export function isRgb(color: Optional<string>, withAlpha: false): color is RgbColorString;

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
