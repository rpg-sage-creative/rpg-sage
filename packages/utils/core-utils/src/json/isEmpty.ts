/** Returns true if the object is keyless or all keys have a value of undefined. */
export function isEmpty(object: unknown): boolean {
	const keys = Object.keys(object as {}) as (keyof typeof object)[];
	return !keys.some(key => (object as {})[key] !== undefined);
}