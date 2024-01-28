import { round } from "@rsc-utils/number-utils";
import { ColorData } from "../ColorData.js";
import { getNamedColor } from "../namedColors.js";
import { parseHex } from "../parseHex.js";
import { hexToAlpha } from "./hexToAlpha.js";
import { alphaToHex } from "./toHex.js";

/** Converts a hex/hexa value (with optional new alpha) to a Color object */
export function hexToColor(value: string, newAlpha?: number): ColorData | null {
	let hexa = parseHex(value);
	if (!hexa) {
		return null;
	}

	const hex = hexa?.slice(0, 7);
	if (hex && newAlpha !== undefined) {
		hexa = hex + alphaToHex(newAlpha);
	}

	const color = getNamedColor(hexa);
	if (color) {
		return color.data;
	}

	const alpha = round(hexToAlpha(hexa.slice(-2)), 3);

	const red = parseInt(hexa.slice(1, 3), 16),
		green = parseInt(hexa.slice(3, 5), 16),
		blue = parseInt(hexa.slice(5, 7), 16);

	return {
		// name: undefined,
		// lower: undefined,
		hexa: hexa,
		hex: hex,
		rgba: `rgba(${red},${green},${blue},${alpha})`,
		rgb: `rgb(${red},${green},${blue})`,
		red: red,
		green: green,
		blue: blue,
		alpha: alpha
	};
}