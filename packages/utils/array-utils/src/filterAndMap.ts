import { type Collection } from "./Collection.js";

/**
 * Filters and maps an array using a single pass through the array.
 * Only values that return "truthy" to the predicate will be sent to the callbackfn.
 */
export function filterAndMap
		<T, U>
		(array: Array<T>, predicate: (value: T, index: number, array: Array<T>) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any)
		: Array<U>;

/**
 * Filters and maps an array using a single pass through the array.
 * Only values that return "truthy" to the predicate will be sent to the callbackfn.
 */
export function filterAndMap
		<T, U>
		(collection: Collection<T>, predicate: (value: T, index: number, collection: Collection<T>) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any)
		: Collection<U>;

export function filterAndMap
		<T, U, V extends Array<T> | Collection<T>, W extends Array<U> | Collection<U>>
		(arrayLike: V, predicate: (value: T, index: number, values: V) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any)
		: W {
	let newIndex = 0;
	const arrayConstructor = arrayLike.constructor as ArrayConstructor;
	const mapped = new arrayConstructor() as W;
	arrayLike.forEach((value, index, array) => {
		if (predicate.call(thisArg, value, index, array as V)) {
			mapped.push(callbackfn.call(thisArg, value, newIndex));
			newIndex++;
		}
	});
	return mapped;
}