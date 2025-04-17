import { isPrimitive } from "../types/index.js";

type NullifyOption = {
	/** set all keys to null */
	nullify: true;

	/** set all keys to undefined using delete */
	undefine?: never;
};

type UndefineOption = {
	/** set all keys to null */
	nullify?: never;

	/** set all keys to undefined using delete */
	undefine: true;
};

type UncacheOptions = NullifyOption | UndefineOption;

/** attempt to call the named function on the given object. */
function attempt(object: any, fnName: "clear" | "destroy"): void {
	if (typeof(object?.[fnName]) === "function") {
		object[fnName]();
	}
}

/**
 * Proactive memory management helper.
 * Calls .clear() and .destroy() on the given object if they exist.
 * The object is then iterated using Object.entries() where .clear() and .destroy() are attempted on each value.
 * If options.nullify is true, then each key of object is set to null after attempting to clear/destroy them.
 * @returns null for convenience, example: cache = uncache(cache);
 */
export function uncache(object: any, options?: NullifyOption): null;

/**
 * Proactive memory management helper.
 * Calls .clear() and .destroy() on the given object if they exist.
 * The object is then iterated using Object.entries() where .clear() and .destroy() are attempted on each value.
 * If options.undefine is true, then each key of object is deleted after attempting to clear/destroy them.
 * @returns undefined for convenience, example: cache = uncache(cache);
 */
export function uncache(object: any, options: UndefineOption): undefined;

export function uncache(object: any, options?: UncacheOptions): null | undefined {
	const retVal = options?.undefine ? undefined : null;

	if (isPrimitive(object)) {
		return retVal;
	}

	attempt(object, "clear");
	attempt(object, "destroy");

	Object.entries(object).forEach(([key, value]) => {
		attempt(value, "clear");
		attempt(value, "destroy");
		if (options?.nullify) {
			object[key] = null;
		}
		if (options?.undefine) {
			delete object[key];
		}
	});

	return retVal;
}