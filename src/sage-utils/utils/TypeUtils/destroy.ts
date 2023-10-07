/**
 * Attempts to call the given function on the given object.
 * @returns true if the function was called, false otherwise.
 */
function call(object: any, fnName: "clear" | "destroy"): boolean {
	if (typeof(object?.[fnName]) === "function") {
		object[fnName]();
		return true;
	}
	return false;
}

/**
 * Attempts to call clear() or destroy() on the given object.
 * @returns true if either function was called, false if neither was called.
 */
function clearOrDestroy(object: any): boolean {
	const cleared = call(object, "clear");
	const destroyed = call(object, "destroy");
	return cleared || destroyed;
}

/**
 * Iterates the keys of the given object to remove references to help memory usage.
 * If a value has a clear() or destroy() function, they are called before the key is set to null.
 * @returns null for convenience, example: cache = destroy(cache);
 */
export function destroy(object: any): null {
	if (object) {
		// try to clear/destroy the given object ...
		if (!clearOrDestroy(object)) {
			// ... else try to clear/destroy the object's properties
			for (const key in object) {
				clearOrDestroy(object[key]);
				object[key] = null;
			}
		}
	}
	return null;
}