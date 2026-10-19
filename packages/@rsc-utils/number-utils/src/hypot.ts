/**
 * Calculates the hypotenuse of the given numbers.
 * If 3 values are given, then the result is: hypot(hypot(x, y), z)
 */
export function hypot(x: number, y: number, z?: number): number {
	const xy = Math.hypot(x, y);
	if (typeof(z) === "number") {
		return Math.hypot(xy, z);
	}
	return xy;
}