/** Returns true if the value given is negative 0, false for any other given value. */
export function isNegativeZero(value?: number): value is -0 {
	return value === 0 ? 1 / value === -Infinity : false;
}