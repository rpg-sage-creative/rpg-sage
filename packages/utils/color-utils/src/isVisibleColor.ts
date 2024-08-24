import type { HexColorString, RgbaColorString, RgbColorString } from "./ColorData.js";
import type { Optional } from "./internal/Optional.js";
import { toColorData } from "./internal/toColorData.js";

type ColorString = HexColorString | RgbColorString | RgbaColorString;

export function isVisibleColor(color: Optional<ColorString>): boolean {
	if (!color) return false; // NOSONAR

	const colorData = toColorData(color);
	if (!colorData) return false; // NOSONAR

	return colorData.alpha === undefined || colorData.alpha > 0;
}
