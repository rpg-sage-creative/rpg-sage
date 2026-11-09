import { round } from "./round.js";


/** Returns the temperature in fahrenheit, rounded to the nearest whole number. */
export function celsiusToFahrenheit(degreesC: number): number;

/** Returns the temperature in fahrenheit, rounded to the number of decimal places given. */
export function celsiusToFahrenheit(degreesC: number, precision: number): number;

export function celsiusToFahrenheit(degreesC: number, precision = 0): number {
	const degreesF = degreesC * 9 / 5 + 32;
	if (precision !== undefined) {
		return round(degreesF, precision);
	}
	return degreesF;
}


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
