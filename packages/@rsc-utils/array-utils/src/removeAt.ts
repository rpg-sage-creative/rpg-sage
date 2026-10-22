import type { OrUndefined } from "@rsc-utils/type-utils";
import { sortPrimitive } from "./sort/sortPrimitive.js";

/** Remove the value at the given index using .splice(). */
export function removeAt<T>(array: T[], index: number): OrUndefined<T>;

/** Remove the values at the given indexes using .splice(). */
export function removeAt<T, U extends OrUndefined<T>[] = OrUndefined<T>[]>(array: T[], indexes: number[]): U[];

export function removeAt<T, U extends OrUndefined<T>[] = OrUndefined<T>[]>(values: T[], indexOrIndexes: number | number[]): OrUndefined<T> | U {
	if (Array.isArray(indexOrIndexes)) {
		// get all the values to be removed
		const removed = indexOrIndexes.map(index => values[index]);

		// sort indexes in reverse order for safer splicing
		const sorted = indexOrIndexes.slice().sort(sortPrimitive).reverse();

		// splice each index to remove from target array
		sorted.forEach(index => values.splice(index, 1));

		// create an array from the one given to return the same type
		const arrayConstructor = values.constructor as ArrayConstructor;
		const indexes = new arrayConstructor() as U;

		// push the values removed into the typed array
		removed.forEach(item => indexes.push(item));

		return indexes;
	}

	// splice and return the single given index
	return values.splice(indexOrIndexes, 1)[0];
}