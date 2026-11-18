/**
 * Adds the appropriate suffix to the given number.
 * Non-whole values are rounded, non-finite values (NaN/±Infinity) are treated as 0, and negative numbers keep their sign while taking the suffix of their magnitude.
 * Ex: 1 becomes "1st"
 */
export function nth(number: number): string {
	const whole = Number.isFinite(number) ? Math.round(number) : 0;
	const magnitude = Math.abs(whole);
	const lastTwoDigits = magnitude % 100;
	if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
		return `${whole}th`;
	}
	const digit = magnitude % 10;
	if (digit === 1) {
		return `${whole}st`;
	}
	if (digit === 2) {
		return `${whole}nd`;
	}
	if (digit === 3) {
		return `${whole}rd`;
	}
	return `${whole}th`;
}
