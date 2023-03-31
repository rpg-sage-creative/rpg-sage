/** converts a temperature from fahrenheit to celcius. */
export function fahrenheitToCelsius(fahrenheit: number) {
	return Math.round((fahrenheit - 32) * 5 / 9);
}
