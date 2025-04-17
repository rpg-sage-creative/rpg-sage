import { round } from "../../number/round.js";

/**
 * Converts a decimal number (between 0-1) alpha to Hex.
 * Defaults to 1.
 * Values less than 0 treated as 0.
 * Values greater than 1 treated as 1.
 */
export function alphaToHex(value = 1): string {
	if (value < 0) {
		value = 0;
	}else if (value > 1) {
		value = 1;
	}
	return numberToHex(value * 255);
}

/**
 * Converts a whole number (0-255) to Hex.
 * Values less than 0 treated as 0.
 * Values greater than 255 treated as 255.
 */
export function numberToHex(value: number): string {
	if (value < 0) {
		value = 0;
	}else if (value > 255) {
		value = 255;
	}
	return round(value, 0).toString(16).padStart(2, "0");
}