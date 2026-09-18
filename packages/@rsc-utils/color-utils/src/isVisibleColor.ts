import type { Optional } from "@rsc-utils/type-utils";
import type { HexColorString, RgbaColorString, RgbColorString } from "./ColorData.js";
import { toColorData } from "./internal/toColorData.js";

type ColorString = HexColorString | RgbColorString | RgbaColorString;

/** Returns true if the given color is valid and has no alpha or an alpha greater than 0. */
export function isVisibleColor(color: Optional<ColorString>): color is ColorString {
	if (!color) return false; // NOSONAR

	const colorData = toColorData(color);
	if (!colorData) return false; // NOSONAR

	return colorData.alpha === undefined || colorData.alpha > 0;
}
