/** Returns true if the given object has no keys. */
export function isKeyless<T>(object: T): boolean {
	return Object.keys(object as {}).length === 0;
}