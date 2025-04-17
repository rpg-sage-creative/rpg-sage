/** Rounds the given number to the given number of decimal places. */
export function round(value: number, decimals: number): number {
	if (isNaN(value) || isNaN(decimals)) {
		return NaN;
	}
	const rounded = Math.round(Number(`${value}e${decimals}`));
	return Number(`${rounded}e-${decimals}`);
}

/*

@todo what was this for???

export function roundToPrecision(x: number, precision = 1) {
	const y = x + precision / 2;
	return y - (y % precision);
}

*/