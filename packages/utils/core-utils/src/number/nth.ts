/** Adds the appropriate suffix to the given number. Ex: 1 becomes "1st" */
export function nth(number: number) {
	const digit = +String(number).slice(-1);
	if (number !== 11 && digit === 1) {
		return `${number}st`;
	}
	if (number !== 12 && digit === 2) {
		return `${number}nd`;
	}
	if (number !== 13 && digit === 3) {
		return `${number}rd`;
	}
	return `${number}th`;
}
