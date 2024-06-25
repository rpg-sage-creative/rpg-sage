import type { HexColorString, RgbString } from "../ColorData.js";
import { parseRgbColor } from "../parseRgbColor.js";
import { alphaToHex, numberToHex } from "./toHex.js";

function rgbaToHexa(red: number, green: number, blue: number, alpha?: number): HexColorString {
	return `#${numberToHex(red)}${numberToHex(green)}${numberToHex(blue)}${alphaToHex(alpha)}`;
}

export function rgbToHex(rgba: RgbString): HexColorString;
export function rgbToHex(rgba: RgbString, newAlpha: number): HexColorString;
export function rgbToHex(red: number, green: number, blue: number): HexColorString;
export function rgbToHex(red: number, green: number, blue: number, alpha: number): HexColorString;
export function rgbToHex(rgbaOrRed: RgbString | number, alphaOrGreen?: number, blue?: number, alpha?: number): HexColorString | undefined {
	if (typeof(rgbaOrRed) === "number") {
		const hexa = rgbaToHexa(rgbaOrRed, alphaOrGreen!, blue!, alpha);
		return alpha === undefined
			? hexa.slice(0, 7) as HexColorString
			: hexa;
	}
	const rgb = parseRgbColor(rgbaOrRed);
	if (rgb) {
		const hexa = rgbaToHexa(rgb.red, rgb.green, rgb.blue, alphaOrGreen ?? rgb.alpha);
		return (alphaOrGreen ?? rgb.alpha) === undefined
			? hexa.slice(0, 7) as HexColorString
			: hexa;
	}
	return undefined;
}
