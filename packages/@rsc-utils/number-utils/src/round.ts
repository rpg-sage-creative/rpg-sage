import { isFiniteNumber } from "@rsc-utils/type-utils";

/**
 * Rounds the given number to the given number of decimal places.
 * Returns NaN if either argument is not a finite number.
 */
export function round(value: number, decimals: number = 0): number {
	if (!isFiniteNumber(value) || !isFiniteNumber(decimals)) {
		return NaN;
	}
	const rounded = Math.round(Number(`${value}e${decimals}`));
	return Number(`${rounded}e-${decimals}`);
}
