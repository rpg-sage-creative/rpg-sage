/** Checks the type to see if it is freezable. */
function canFreeze(value?: unknown): value is object {
	if (value) {
		switch(typeof(value)) {
			// objects and arrays; but also Date ?
			case "object": return true;
			case "function": return true;
			default: return false;
		}
	}
	return false;
}

/** Uses reflection to recursively freeze an object. */
export function deepFreeze<T extends object>(object: T): T {
	// use weak set to infinite looping
	const frozen = new WeakSet();

	const freeze = <U extends object>(obj: U) => {
		if (!frozen.has(obj)) {
			// add to the weak set to avoid infinite looping
			frozen.add(obj);

			// get child keys to freeze
			const keys = Reflect.ownKeys(obj) as (keyof U)[];

			// iterate the keys
			for (const key of keys) {
				const value = obj[key];
				if (canFreeze(value)) {
					freeze(value);
				}
			}

			Object.freeze(obj);
		}
		return obj;
	};

	if (canFreeze(object)) {
		freeze(object);
	}

	return object;
}