import { round } from "./round.js";


/** Returns the temperature in fahrenheit, rounded to the nearest whole number. */
export function celsiusToFahrenheit(degreesC: number): number;

/** Returns the temperature in fahrenheit, rounded to the number of decimal places given. */
export function celsiusToFahrenheit(degreesC: number, decimals: number): number;

export function celsiusToFahrenheit(degreesC: number, decimals = 0): number {
	const degreesF = degreesC * 9 / 5 + 32;
	if (decimals !== undefined) {
		return round(degreesF, decimals);
	}
	return degreesF;
}


/** Returns the temperature in celsius, rounded to the nearest whole number. */
export function fahrenheitToCelsius(degreesF: number): number;

/** Returns the temperature in celsius, rounded to the number of decimal places given. */
export function fahrenheitToCelsius(degreesF: number, decimals: number): number;

export function fahrenheitToCelsius(degreesF: number, decimals = 0): number {
	const degreesC = (degreesF - 32) * 5 / 9;
	if (decimals !== undefined) {
		return round(degreesC, decimals);
	}
	return degreesC;
}
