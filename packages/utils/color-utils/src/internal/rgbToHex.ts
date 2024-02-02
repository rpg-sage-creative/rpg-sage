import { parseRgbColor } from "../parseRgbColor.js";
import { alphaToHex, numberToHex } from "./toHex.js";

function rgbaToHexa(red: number, green: number, blue: number, alpha?: number): string {
	return `#${numberToHex(red)}${numberToHex(green)}${numberToHex(blue)}${alphaToHex(alpha)}`;
}

export function rgbToHex(rgba: string): string;
export function rgbToHex(rgba: string, newAlpha: number): string;
export function rgbToHex(red: number, green: number, blue: number): string;
export function rgbToHex(red: number, green: number, blue: number, alpha: number): string;
export function rgbToHex(rgbaOrRed: string | number, alphaOrGreen?: number, blue?: number, alpha?: number): string | null {
	if (typeof(rgbaOrRed) === "number") {
		const hex = rgbaToHexa(rgbaOrRed, alphaOrGreen!, blue!, alpha);
		return alpha === undefined
			? hex.slice(0, 7)
			: hex;
	}
	const rgb = parseRgbColor(rgbaOrRed);
	if (rgb) {
		const hex = rgbaToHexa(rgb.red, rgb.green, rgb.blue, alphaOrGreen ?? rgb.alpha);
		return (alphaOrGreen ?? rgb.alpha) === undefined
			? hex.slice(0, 7)
			: hex;
	}
	return null;
}
