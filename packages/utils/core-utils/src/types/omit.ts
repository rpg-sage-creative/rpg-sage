/** Returns a new object by omitting the given keys from the given object. This is a shallow copy, meaning any values that are objects will be references to the original. */
export function omit<T, U extends keyof T, V extends Omit<T, U>>(object: T, ...omittedKeys: U[]): V {
	const out: V = {} as any;
	const keys = Object.keys(object as object) as U[];
	keys.forEach(key => {
		if (!omittedKeys.includes(key)) {
			// typescript really doesn't like mixing and matching types like this
			out[key as unknown as keyof V] = object[key] as any;
		}
	});
	return out;
}
