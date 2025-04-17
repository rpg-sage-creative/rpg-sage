import { round } from "../number/round.js";
import type { Optional } from "../types/generics.js";
import { matchRgb } from "./internal/matchRgb.js";

/** Simple type to store r/g/b values */
type RGB = { red:number; green:number; blue:number; };

/** Simple type to store r/g/b/a values */
type RGBA = { red:number; green:number; blue:number; alpha?:number; };

/** Parses the value to get all the r/g/b/a component values, alpha only if present. */
export function parseRgbColor(value: Optional<string>): RGBA | undefined;

/** Parses the value to get all the r/g/b/a component values. */
export function parseRgbColor(value: Optional<string>, includeAlpha: true): RGBA | undefined;

/** Parses the value to get all the r/g/b component values. */
export function parseRgbColor(value: Optional<string>, includeAlpha: false): RGB | undefined;

export function parseRgbColor(value: Optional<string>, includeAlpha?: boolean): RGBA | undefined {
	const match = matchRgb(value);
	if (!match) return undefined; // NOSONAR

	const { red, green, blue, alpha } = match;

	if (includeAlpha === false) {
		return { red, green, blue };
	}

	// Because this is a decimal representation of 0%-100%, values are rounded to precision 2: 0.00
	const roundedAlpha = alpha !== undefined ? round(alpha, 2) : undefined;

	if (includeAlpha === true) {
		return { red, green, blue, alpha:roundedAlpha ?? 1 };
	}

	return { red, green, blue, alpha:roundedAlpha };
}
