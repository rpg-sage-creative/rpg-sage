import { type Collection } from "./Collection.js";
import { sortPrimitive } from "./sort/sortPrimitive.js";

/** Remove the value at the given index using .splice(). */
export function removeAt<T>(array: Array<T>, index: number): T | undefined;

/** Remove the value at the given index using .splice(). */
export function removeAt<T>(collection: Collection<T>, index: number): T | undefined;

/** Remove the values at the given indexes using .splice(). */
export function removeAt<T>(array: Array<T>, indexes: number[]): Array<T | undefined>;

/** Remove the values at the given indexes using .splice(). */
export function removeAt<T>(collection: Collection<T>, indexes: number[]): Collection<T | undefined>;

export function removeAt<T, U extends Array<T>, V extends Array<T | undefined>>(values: U, indexOrIndexes: number | number[]): T | undefined | V {
	if (Array.isArray(indexOrIndexes)) {
		const removed = indexOrIndexes.map(index => values[index]);
		const sorted = indexOrIndexes.slice().sort(sortPrimitive).reverse();
		sorted.forEach(index => values.splice(index, 1));
		const arrayConstructor = values.constructor as ArrayConstructor;
		const indexes = new arrayConstructor() as V;
		indexes.push(...removed);
		return indexes;
	}
	return values.splice(indexOrIndexes, 1)[0];
}