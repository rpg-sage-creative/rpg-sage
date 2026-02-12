/** @internal Based on array-utils sortPrimitive */
export function numberSorter(a: number, b: number): -1 | 0 | 1 {
	if (a === undefined) {
		return 1;
	}else if (b === undefined) {
		return -1;
	}

	if (a === null) {
		return 1;
	}else if (b === null) {
		return -1;
	}

	if (a < b) {
		return -1;
	}else if (a > b) {
		return 1;
	}

	return 0;
}