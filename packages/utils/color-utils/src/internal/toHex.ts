/** Converts a decimal number (between 0-1) alpha to Hex */
export function alphaToHex(value: number | undefined): string {
	return numberToHex(Math.round((value ?? 1) * 255));
}

/** Converts a whole number (0-255) to Hex */
export function numberToHex(value: number): string {
	return value.toString(16).padStart(2, "0");
}