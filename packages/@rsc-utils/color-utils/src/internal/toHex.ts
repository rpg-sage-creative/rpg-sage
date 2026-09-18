/**
 * Converts a decimal number (between 0-1) alpha to Hex.
 * Defaults to 1.
 * Values less than 0 treated as 0.
 * Values greater than 1 treated as 1.
 */
export function alphaToHex(value = 1): string {
	const bounded = Math.max(0, Math.min(value, 1));
	return numberToHex(bounded * 255);
}

/**
 * Converts a whole number (0-255) to Hex.
 * Values less than 0 treated as 0.
 * Values greater than 255 treated as 255.
 */
export function numberToHex(value: number): string {
	const rounded = Math.round(value);
	const bounded = Math.max(0, Math.min(rounded, 255));
	return bounded.toString(16).padStart(2, "0");
}