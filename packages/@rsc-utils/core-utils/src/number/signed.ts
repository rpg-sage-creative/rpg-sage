/**
 * Returns the number as a string with a + showing positive or a – showing negative.
 * https://en.wikipedia.org/wiki/Plus_and_minus_signs
 */
export function signed(value: number): string {
	if (value < 0) {
		return `−${value}`;
	}
	return `+${value}`;
}