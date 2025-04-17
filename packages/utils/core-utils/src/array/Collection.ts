import { isDefined } from "../types/typeGuards/isDefined.js";
import { toUnique } from "./filter/toUnique.js";
import { filterAndMap } from "./filterAndMap.js";
import { remove } from "./remove.js";
import { removeAt } from "./removeAt.js";
import { without } from "./without.js";

type ValueOf<T, U extends keyof T = keyof T> = T[U];

export class Collection<T> extends Array<T> {

	//#region instance methods

	/** Convenience for this.length === 0 */
	public get isEmpty(): boolean {
		return this.length === 0;
	}

	/** Returns the first value found by the predicate. If one isn't found, it returns the first value found by the second predicate. Uses only one loop/iteration. */
	// public findOrElse(predicate: (value: T, index: number, obj: Collection<T>) => unknown, orElsePredicate: (value: T, index: number, obj: Collection<T>) => unknown, thisArg?: any): T | undefined {
	// 	let orElse: T | undefined;
	// 	for (let index = 0, len = this.length; index < len; index++) {
	// 		const value = this[index];
	// 		if (predicate.call(thisArg, value, index, this)) {
	// 			return value;
	// 		}else if (!value && orElsePredicate.call(thisArg, value, index, this)) {
	// 			orElse = value;
	// 		}
	// 	}
	// 	return orElse;

	// 	// return this.find(predicate as (value: T, index: number, array: T[]) => unknown, thisArg)
	// 	// 	?? this.find(orElsePredicate as (value: T, index: number, array: T[]) => unknown, thisArg);
	// }

	/** Returns the value and its index ([value, index]), or [undefined, -1] if the value is not found. */
	public findWithIndex(predicate: (value: T, index: number, obj: Collection<T>) => unknown, thisArg?: any): [T | undefined, number] {
		const index = this.findIndex(predicate as (value: T, index: number, array: T[]) => unknown, thisArg);
		return [index === -1 ? undefined : this[index], index];
	}

	/** Removes all objects. */
	public empty(): void {
		this.length = 0;
	}

	/** Returns a new Collection with only values that are not null and not undefined. */
	public existing(): Collection<NonNullable<T>> {
		return this.filter(isDefined) as Collection<NonNullable<T>>;
	}

	// /** Uses asynchronous logic to filter an array. Exceptions in the predicate will be sent to console.warn and considered "falsey". */
	// public async filterAsync(predicate: (value: T, index: number, array: T[]) => Promise<unknown>, thisArg?: any): Promise<Collection<T>> {
	// 	return filterAsync(this, predicate, thisArg);
	// }

	/** Convenience method for .filter().map() that uses a single iteration */
	public filterAndMap<U>(predicate: (value: T, index: number, values: Collection<T>) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any): Collection<U> {
		return filterAndMap(this, predicate, callbackfn, thisArg);
	}

	// /** Uses asynchronous logic to perform a find on an array. Exceptions in the predicate will be sent to console.warn and considered "falsey". */
	// public async findAsync(predicate: (value: T, index: number, obj: T[]) => Promise<T>, thisArg?: any): Promise<T | undefined> {
	// 	return Collection.findAsync(this, predicate, thisArg);
	// }

	// /** Uses asynchronous functions to iterate over a collection in order. Exceptions in the callback will be sent to console.warn. */
	// public async forEachAsync(callbackfn: (value: T, newIndex: number, values: Collection<T>) => Promise<void>, thisArg?: any): Promise<void> {
	// 	return Collection.forEachAsync(this, callbackfn, thisArg);
	// }

	/** Returns the first object. */
	public first(): T | undefined {
		return this[0];
	}

	/** Returns the last object. */
	public last(): T | undefined {
		return this[this.length - 1];
	}

	// /** Uses asynchronous functions to map a collection in order. Exceptions in the callback will be sent to console.warn. */
	// public async mapAsync<U>(callbackfn: (value: T, newIndex: number, values: Collection<T>) => Promise<U>, thisArg?: any): Promise<Collection<U | void>> {
	// 	return Collection.mapAsync(this, callbackfn, thisArg);
	// }

	// /** Partitions the values into nested Collections based on the partitionfn */
	// public partition(partitionfn: (value: T, index: number, collection: Collection<T>) => number, thisArg?: any): Collection<Collection<T>> {
	// 	return Collection.partition(this, partitionfn, thisArg);
	// }

	/** Convenience for .map(item => item.key); */
	public pluck<U extends keyof T = keyof T, V extends ValueOf<T, U> = ValueOf<T, U>>(key: U): V[];
	/** When onlyUnique is true: Convenience for .map(item => item.key).filter(unique); */
	public pluck<U extends keyof T = keyof T, V extends ValueOf<T, U> = ValueOf<T, U>>(key: U, onlyUnique: boolean): V[];
	public pluck<U extends keyof T = keyof T, V extends ValueOf<T, U> = ValueOf<T, U>>(key: U, onlyUnique?: boolean): V[] {
		const values = this.map(value => value[key] as V);
		if (onlyUnique) {
			return values.filter(toUnique);
		}
		return values;
	}

	/** Removes the values that return a truthy value, returning values that are't undefined. */
	public remove(predicate: (value: T, index: number, obj: Collection<T>) => unknown, thisArg?: any): Collection<T> {
		return remove(this, predicate, thisArg);
	}

	/** Remove the value at the given index. */
	public removeAt(index: number): T | undefined;
	/** Remove the values at the given indexes. */
	public removeAt(indexes: number[]): (T | undefined)[];
	public removeAt(indexOrIndexes: number | number[]): T | undefined | (T | undefined)[] {
		return removeAt(this, indexOrIndexes as number);
	}

	/** Returns a new array that doesn't contain the passed args */
	public without(...args: T[]): Collection<T> {
		return without(this, ...args) as Collection<T>;
	}

	//#endregion

	//#region static methods

	/** Creates a Collection from any ArrayLike */
	public static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): Collection<T>;
	/** Creates a Collection from any ArrayLike by mapping each element */
	public static from<T, U>(arrayLike: ArrayLike<T> | Iterable<T>, mapfn: (v: T, k: number) => U, thisArg?: any): Collection<U>;
	public static from<T, U>(arrayLike: ArrayLike<T> | Iterable<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): Collection<any> {
		const collection = new Collection();
		collection.push(...Array.from(arrayLike, mapfn!, thisArg));
		return collection;
	}

	//#endregion
}

// Update the Array signatures to indicate that we are now returning a Collection
export interface Collection<T> {

	concat(...items: ConcatArray<T>[]): Collection<T>;
	concat(...items: (T | ConcatArray<T>)[]): Collection<T>;

	filter(predicate: (value: T, index: number, collection: Collection<T>) => unknown, thisArg?: any): Collection<T>;
	filter<S extends T>(predicate: (value: T, index: number, collection: Collection<T>) => value is S, thisArg?: any): Collection<S>;

	forEach(callbackfn: (value: T, index: number, collection: Collection<T>) => void, thisArg?: any): void;

	map<U>(callbackfn: (value: T, index: number, collection: Collection<T>) => U, thisArg?: any): Collection<U>;

	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: Collection<T>) => T): T;
	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: Collection<T>) => T, initialValue: T): T;
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, collection: Collection<T>) => U, initialValue: U): U;

	reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: Collection<T>) => T): T;
	reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: Collection<T>) => T, initialValue: T): T;
	reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, collection: Collection<T>) => U, initialValue: U): U;

	reverse(): this;

	slice(start?: number, end?: number): Collection<T>;

	splice(start: number, deleteCount?: number): Collection<T>;
	splice(start: number, deleteCount: number, ...items: T[]): Collection<T>;
}

export default Collection;
