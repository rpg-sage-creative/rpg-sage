/**
 * Iterates the keys of the given object to remove references to help memory usage.
 * If a value has a clear() or destroy() function, they are called before the key is set to null.
 * @returns null for convenience, example: cache = destroy(cache);
 */
export function destroy(core: any): null {
	if (core) {
		for (const key in core) {
			if (typeof(core[key]?.clear) === "function") {
				core[key].clear();
			}
			if (typeof(core[key]?.destroy) === "function") {
				core[key].destroy();
			}
			core[key] = null;
		}
	}
	return null;
}