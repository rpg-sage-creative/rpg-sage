import type { Optional, OrNull, OrUndefined } from "./generics.js";
import { isNullOrUndefined } from "./typeGuards/isNullOrUndefined.js";

/**
 * Returns a new object by omitting the given keys from the given object.
 * This is a shallow copy, meaning any values that are objects will be references to the original.
 * If the object given is null, null is returned.
 * If the object given is undefined, undefined is returned.
 */
export function omit<T, U extends keyof T, V extends Omit<T, U>>(object: T, ...omittedKeys: U[]): V;
export function omit<T, U extends keyof T, V extends Omit<T, U>>(object: OrNull<T>, ...omittedKeys: U[]): OrNull<V>;
export function omit<T, U extends keyof T, V extends Omit<T, U>>(object: OrUndefined<T>, ...omittedKeys: U[]): OrUndefined<V>;
export function omit<T, U extends keyof T, V extends Omit<T, U>>(object: Optional<T>, ...omittedKeys: U[]): Optional<V>;
export function omit<T, U extends keyof T, V extends Omit<T, U>>(object: Optional<T>, ...omittedKeys: U[]): Optional<V> {
	if (isNullOrUndefined(object)) return object;

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
