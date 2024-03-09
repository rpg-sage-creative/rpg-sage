
/**
 * Iterates the keys in {changes} to find any with a value that is NOT undefined.
 * These values are then applied to {value}.
 * {value} is then returned.
*/
export function applyChanges<T>(value: T, changes: Partial<T>): T {
	// make sure we have two objects
	if (value && changes) {
		// get and cast the keys
		const keys = Object.keys(changes) as (keyof T)[];
		keys.forEach(key => {
			if (changes[key] !== undefined) {
				// cast value as any to avoid ts(2322)
				value[key] = changes[key] as any;
			}
		});
	}
	return value;
}