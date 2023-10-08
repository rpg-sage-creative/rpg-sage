import { isPrimitive } from "./isPrimitive";

type UncacheOptions = {
	/** set all keys to null */
	nullify?: boolean;
};

function attempt(object: any, fnName: "clear" | "destroy"): void {
	if (typeof(object[fnName]) === "function") {
		object[fnName]();
	}
}

/**
 * Proactive memory management helper.
 * Calls .clear() and .destroy() on the given object if they exist.
 * The object is then iterated using Objec.entries() where .clear() and .destroy() are attempted on each value.
 * @returns null for convenience, example: cache = uncache(cache);
 */
export function uncache(object: any): null;

/**
 * Proactive memory management helper.
 * Calls .clear() and .destroy() on the given object if they exist.
 * The object is then iterated using Object.entries() where .clear() and .destroy() are attempted on each value.
 * If options.nullify is true, then each key of object is set to null after attempting to clear/destroy them.
 * @returns null for convenience, example: cache = uncache(cache);
 */
export function uncache(object: any, options: UncacheOptions): null;

export function uncache(object: any, options?: UncacheOptions): null {
	if (isPrimitive(object)) return null;

	attempt(object, "clear");
	attempt(object, "destroy");

	Object.entries(object).forEach(([key, value]) => {
		attempt(value, "clear");
		attempt(value, "destroy");
		if (options?.nullify) {
			object[key] = null;
		}
	});

	return null;
}