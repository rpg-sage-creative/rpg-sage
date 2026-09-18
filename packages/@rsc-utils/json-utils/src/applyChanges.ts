
/** Make all properties in T type Optional */
type Args<T> = { [P in keyof T]?: T[P] | null | undefined; };

/**
 * Finds all keys of {changes} with values that are !undefined;
 * These values are then applied to {base}.
 * base.key is set to undefined when changes.key is null unless {unsetValue} is null.
 * Returns true if any changes were made.
*/
export function applyChanges<T>(base: T, changed: Args<T>, unsetValue?: null): boolean {
	let hasChanges = false;
	if (base && changed) {
		const keys = Object.keys(changed) as (keyof T)[];
		for (const key of keys) {
			// we only modify it if the new value is not undefined
			const newValue = changed[key];
			if (newValue !== undefined) {
				// save for comparison
				const oldValue = base[key];

				// unset when value is null
				if (newValue === null) {
					// cast as any to avoid ts(2322)
					base[key] = unsetValue as any;

				// set it otherwise
				}else {
					// cast as any to avoid ts(2322)
					base[key] = newValue as any;
				}

				// compare original value to final value
				hasChanges = hasChanges || oldValue !== base[key];
			}
		}
	}
	return hasChanges;
}