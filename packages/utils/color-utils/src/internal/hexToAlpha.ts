import { round } from "@rsc-utils/number-utils";

/** Converts a Hex based alpha to a decimal number (between 0-1) value */
export function hexToAlpha(value: string): number {
	return round(parseInt(value, 16) / 255, 3);
}