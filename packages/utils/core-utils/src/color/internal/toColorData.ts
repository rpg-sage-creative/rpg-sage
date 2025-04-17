import type { ColorData } from "../ColorData.js";
import { isHexColorString } from "../isHexColorString.js";
import { isRgbColorString } from "../isRgbColorString.js";
import { getNamedColor } from "../namedColors.js";
import { hexToColor } from "./hexToColor.js";
import { rgbToHex } from "./rgbToHex.js";

/** Converts any given values to Hex and then to a Color object */
export function toColorData(color: string): ColorData;
export function toColorData(color: string, alpha: number): ColorData;
export function toColorData(color: ColorData, alpha: number): ColorData;
export function toColorData(red: number, green: number, blue: number): ColorData;
export function toColorData(red: number, green: number, blue: number, alpha: number): ColorData;
export function toColorData(colorOrRed: string | number | ColorData, alphaOrGreen?: number, blue?: number, alpha?: number): ColorData | undefined {
	if (typeof(colorOrRed) === "number") {
		if (alpha !== undefined) {
			return hexToColor(rgbToHex(colorOrRed, alphaOrGreen!, blue!, alpha));
		}else {
			return hexToColor(rgbToHex(colorOrRed, alphaOrGreen!, blue!));
		}
	}else if (typeof(colorOrRed) === "object") {
		return hexToColor(colorOrRed.hexa, alphaOrGreen);
	}

	const namedColor = getNamedColor(colorOrRed?.toLowerCase());
	if (namedColor) {
		return hexToColor(namedColor.hexa, alphaOrGreen);
	}

	if (isHexColorString(colorOrRed)) {
		return hexToColor(colorOrRed, alphaOrGreen);
	}
	if (isRgbColorString(colorOrRed)) {
		return hexToColor(rgbToHex(colorOrRed), alphaOrGreen);
	}

	return undefined;
}