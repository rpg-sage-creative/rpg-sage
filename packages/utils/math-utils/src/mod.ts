export function mod(a: number, b: number): number {
	let result = a % b;
	if (result < 0) {
		result += b;
	}
	return result;
}
