import { round } from "../number/round.js";

/** Returns the temperature in celsius, rounded to the nearest whole number. */
export function fahrenheitToCelsius(degreesF: number): number;

/** Returns the temperature in celsius, rounded to the number of decimal places given. */
export function fahrenheitToCelsius(degreesF: number, precision: number): number;

export function fahrenheitToCelsius(degreesF: number, precision = 0): number {
	const degreesC = (degreesF - 32) * 5 / 9;
	if (precision !== undefined) {
		return round(degreesC, precision);
	}
	return degreesC;
}
