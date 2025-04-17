import type { Optional } from "../types/generics.js";
import type { RgbaColorString, RgbColorString } from "./ColorData.js";
import { matchRgb } from "./internal/matchRgb.js";

/** Tests for RGB or RGBA */
export function isRgbColorString(color: Optional<string>): color is RgbColorString | RgbaColorString;

/** Tests explicitly for RGBA (WITH alpha) */
export function isRgbColorString(color: Optional<string>, withAlpha: true): color is RgbaColorString;

/** Tests explicitly for RGB (WITHOUT alpha) */
export function isRgbColorString(color: Optional<string>, withAlpha: false): color is RgbColorString;

export function isRgbColorString(color: Optional<string>, withAlpha?: boolean): boolean {
	const match = matchRgb(color);
	if (!match) return false; // NOSONAR

	if (withAlpha === true) {
		return match.alpha !== undefined;

	}else if (withAlpha === false) {
		return match.alpha === undefined;
	}

	return true;
}
