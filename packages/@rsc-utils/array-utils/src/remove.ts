import { isDefined } from "@rsc-utils/type-utils";
import { removeAt } from "./removeAt.js";

/** Removes the values that return a truthy value, returning values that are defined (!null && !undefined). */
export function remove<T, U extends T[] = T[]>(array: T[], predicate: (value: T, index: number, obj: U) => unknown, thisArg?: any): U {
	// test each value against the predicate and store the index of those that are truthy
	const indexes: number[] = [];
	array.forEach((value, index, obj) => {
		if (predicate.call(thisArg, value, index, obj as U)) {
			indexes.push(index);
		}
	});

	// removeAt safely removes values by index
	return removeAt(array, indexes)
		// we only care about values that are defined
		.filter(isDefined) as U;
}