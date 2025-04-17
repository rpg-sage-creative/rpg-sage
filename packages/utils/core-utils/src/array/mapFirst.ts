import type { OrUndefined } from "../types/generics.js";
import { isDefined } from "../types/index.js";
import type Collection from "./Collection.js";

/**
 * Iterates the given array and returns the first mapped value returned from callbackfn that isDefined() returns true for.
 * Essentially a convenience method for array.map(callbackfn).find(isDefined) that uses a single iteration/loop.
 */
export function mapFirst
		<T, U>
		(array: Array<T>, callbackfn: (value: T, index: number, array: Array<T>) => U, thisArg?: any)
		: OrUndefined<U>;

/**
 * Iterates the given collection and returns the first mapped value returned from callbackfn that isDefined() returns true for.
 * Essentially a convenience method for collection.map(callbackfn).find(isDefined) that uses a single iteration/loop.
 */
export function mapFirst
		<T, U>
		(collection: Collection<T>, callbackfn: (value: T, index: number, collection: Collection<T>) => U, thisArg?: any)
		: OrUndefined<U>;

export function mapFirst
		<T, U, V extends Array<T> | Collection<T>>
		(arrayLike: V, callbackfn: (value: T, index: number, values: V) => U, thisArg?: any)
		: OrUndefined<U> {
	for (let index = 0; index < arrayLike.length; index++) {
		const result = callbackfn.call(thisArg, arrayLike[index], index, arrayLike);
		if (isDefined(result)) {
			return result;
		}
	}
	return undefined;
}