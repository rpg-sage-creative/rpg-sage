import { isDefined } from "../types/typeGuards/isDefined.js";
import type { Collection } from "./Collection.js";
import { removeAt } from "./removeAt.js";

/** Removes the values that return a truthy value, returning values that are defined (!null && !undefined). */
export function remove<T>(array: Array<T>, predicate: (value: T, index: number, obj: Array<T>) => unknown, thisArg?: any): Array<T>;

/** Removes the values that return a truthy value, returning values that are defined (!null && !undefined). */
export function remove<T>(collection: Collection<T>, predicate: (value: T, index: number, obj: Collection<T>) => unknown, thisArg?: any): Collection<T>;

export function remove<T, U extends Array<T>>(array: U, predicate: (value: T, index: number, obj: U) => unknown, thisArg?: any): U {
	const indexes: number[] = [];
	array.forEach((value, index, obj) => {
		if (predicate.call(thisArg, value, index, obj as U)) {
			indexes.push(index);
		}
	});
	return removeAt(array, indexes).filter(isDefined) as U;
}