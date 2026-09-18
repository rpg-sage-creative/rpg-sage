/** Returns true if the object is UNDEFINED. */
export function isUndefined(value: unknown): value is undefined {
	return value === undefined;
}
