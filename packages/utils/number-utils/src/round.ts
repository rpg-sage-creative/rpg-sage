/** Rounds the given number to the given number of decimal places. */
export function round(value: number, decimals: number): number {
	if (isNaN(value) || isNaN(decimals)) {
		return NaN;
	}
	const rounded = Math.round(Number(`${value}e${decimals}`));
	return Number(`${rounded}e-${decimals}`);
}
