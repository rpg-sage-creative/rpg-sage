export function nameSorter(a: string, b: string) {
	if (a === undefined) return 1;
	if (b === undefined) return -1;

	if (a === null) return 1;
	if (b === null) return -1;

	const aL = a.toLowerCase();
	const bL = b.toLowerCase();
	if (aL !== bL) {
		return aL < bL ? -1 : 1;
	}
	if (a !== b) {
		return a < b ? 1 : -1;
	}
	return 0;
}