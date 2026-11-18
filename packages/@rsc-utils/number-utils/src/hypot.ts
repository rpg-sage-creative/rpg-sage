import { isFiniteNumber } from "@rsc-utils/type-utils";

/**
 * Calculates the hypotenuse of the given numbers.
 * If 3 values are given, then the result is: hypot(hypot(x, y), z)
 * Non-finite x/y yield 0; a non-finite z is ignored (the two-dimension result is returned).
 */
export function hypot(x: number, y: number, z?: number): number {
	if (!isFiniteNumber(x) || !isFiniteNumber(y)) return 0;
	const xy = Math.hypot(x, y);
	if (isFiniteNumber(z)) {
		return Math.hypot(xy, z);
	}
	return xy;
}