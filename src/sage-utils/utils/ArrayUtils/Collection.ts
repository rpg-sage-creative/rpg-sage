import { isDefined } from "../..";
import { sortDescending } from "./Sort";

type ValueOf<T, U extends keyof T = keyof T> = T[U];

export class Collection<T> extends Array<T> {

	//#region instance methods

	/** Convenience for this.length === 0 */
	public get isEmpty(): boolean {
		return this.length === 0;
	}

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

	public filterThenEach(predicate: (value: T, index: number, values: Collection<T>) => unknown, callbackfn: (value: T, newIndex: number) => void, thisArg?: any): void {
		Collection.filterThenEach(this, predicate, callbackfn, thisArg);
	}

	public filterThenMap<U>(predicate: (value: T, index: number, values: Collection<T>) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any): Collection<U> {
		return Collection.filterThenMap(this, predicate, callbackfn, thisArg);
	}

	/** Returns the first object. */
	public first(): T | undefined {
		return this[0];
	}

	/** Returns the last object. */
	public last(): T | undefined {
		return this[this.length - 1];
	}

	/** Partitions the values into nested Collections based on the partitionfn */
	public partition(partitionfn: (value: T, index: number, collection: Collection<T>) => number, thisArg?: any): Collection<Collection<T>> {
		return Collection.partition(this, partitionfn, thisArg);
	}

	public pluck<U extends keyof T = keyof T, V extends ValueOf<T, U> = ValueOf<T, U>>(key: U): V[] {
		return this.map(value => value[key] as V);
	}

	/** Removes the values that return a truthy value, returning values that are't undefined. */
	public remove(predicate: (value: T, index: number, obj: Collection<T>) => unknown, thisArg?: any): Collection<T> {
		return Collection.remove(this, predicate, thisArg);
	}

	/** Remove the value at the given index. */
	public removeAt(index: number): T | undefined;
	/** Remove the values at the given indexes. */
	public removeAt(indexes: number[]): (T | undefined)[];
	public removeAt(indexOrIndexes: number | number[]): T | undefined | (T | undefined)[] {
		return Collection.removeAt(this, indexOrIndexes as number);
	}

	/** Returns a new array that doesn't contain the passed args */
	public without(...args: T[]): Collection<T> {
		return Collection.without(this, ...args) as Collection<T>;
	}

	//#endregion

	//#region static methods

	/** Convenience method for [].filter().forEach() that uses a single iteration */
	public static filterThenEach<T>(array: Array<T>, predicate: (value: T, index: number, array: Array<T>) => unknown, callbackfn: (value: T, newIndex: number) => void, thisArg?: any): void;
	public static filterThenEach<T>(collection: Collection<T>, predicate: (value: T, index: number, collection: Collection<T>) => unknown, callbackfn: (value: T, newIndex: number) => void, thisArg?: any): void;
	public static filterThenEach<T, U extends Array<T> | Collection<T>>(values: U, predicate: (value: T, index: number, values: U) => unknown, callbackfn: (value: T, newIndex: number) => void, thisArg?: any): void {
		let newIndex = 0;
		values.forEach((value, index, _) => {
			if (predicate.call(thisArg, value, index, _ as U)) {
				callbackfn.call(thisArg, value, newIndex);
				newIndex++;
			}
		});
	}

	/** Convenience method for [].filter().map() that uses a single iteration */
	public static filterThenMap<T, U>(array: Array<T>, predicate: (value: T, index: number, array: Array<T>) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any): Collection<U>;
	public static filterThenMap<T, U>(collection: Collection<T>, predicate: (value: T, index: number, collection: Collection<T>) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any): Collection<U>;
	public static filterThenMap<T, U, V extends Array<T> | Collection<T>>(values: V, predicate: (value: T, index: number, values: V) => unknown, callbackfn: (value: T, newIndex: number) => U, thisArg?: any): Collection<U> {
		let newIndex = 0;
		const mapped = new Collection<U>();
		values.forEach((value, index, _) => {
			if (predicate.call(thisArg, value, index, _ as V)) {
				mapped.push(callbackfn.call(thisArg, value, newIndex));
				newIndex++;
			}
		});
		return mapped;
	}

	/** Creates a Collection from any ArrayLike */
	public static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): Collection<T>;
	public static from<T, U>(arrayLike: ArrayLike<T> | Iterable<T>, mapfn: (v: T, k: number) => U, thisArg?: any): Collection<U>;
	public static from<T, U>(arrayLike: ArrayLike<T> | Iterable<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): Collection<any> {
		const collection = new Collection();
		collection.push(...Array.from(arrayLike, mapfn!, thisArg));
		return collection;
	}

	/** Partitions the array into nested Collections based on the partitionfn */
	public static partition<T>(array: Array<T>, partitionfn: (value: T, index: number, array: Array<T>) => number, thisArg?: any): Collection<Collection<T>>;
	public static partition<T>(collection: Collection<T>, partitionfn: (value: T, index: number, collection: Collection<T>) => number, thisArg?: any): Collection<Collection<T>>;
	public static partition<T, U extends Array<T> | Collection<T>>(values: U, partitionfn: (value: T, index: number, values: U) => number, thisArg?: any): Collection<Collection<T>> {
		const partitioned = new Collection<Collection<T>>();
		//TODO: for smarter allowance of children use array.constructor
		values.forEach((value, index, _values) => {
			const partIndex = partitionfn.call(thisArg, value, index, _values as U);
			if (!partitioned[partIndex]) {
				partitioned[partIndex] = new Collection();
			}
			partitioned[partIndex].push(value);
		});
		return partitioned;
	}

	/** Removes the values that return a truthy value, returning values that are't undefined. */
	public static remove<T>(array: Array<T>, predicate: (value: T, index: number, obj: Array<T>) => unknown, thisArg?: any): Collection<T>;
	public static remove<T>(collection: Collection<T>, predicate: (value: T, index: number, obj: Collection<T>) => unknown, thisArg?: any): Collection<T>;
	public static remove<T, U extends Array<T>>(array: U, predicate: (value: T, index: number, obj: U) => unknown, thisArg?: any): Collection<T> {
		const indexes: number[] = [];
		array.forEach((value, index, obj) => {
			if (predicate.call(thisArg, value, index, obj as U)) {
				indexes.push(index);
			}
		});
		return Collection.removeAt(array, indexes).existing();
	}

	/** Remove the value at the given index using .splice(). */
	public static removeAt<T>(array: Array<T>, index: number): T | undefined;
	public static removeAt<T>(collection: Collection<T>, index: number): T | undefined;
	/** Remove the values at the given indexes using .splice(). */
	public static removeAt<T>(array: Array<T>, indexes: number[]): Collection<T | undefined>;
	public static removeAt<T>(collection: Collection<T>, indexes: number[]): Collection<T | undefined>;
	public static removeAt<T, U extends Array<T>>(values: U, indexOrIndexes: number | number[]): T | undefined | Collection<T | undefined> {
		if (Array.isArray(indexOrIndexes)) {
			const removed = indexOrIndexes.map(index => values[index]);
			const sorted = indexOrIndexes.slice().sort(sortDescending);
			sorted.forEach(index => values.splice(index, 1));
			return new Collection<T>(...removed);
		}
		return values.splice(indexOrIndexes, 1)[0];
	}

	/** Returns a new array that doesn't contain the passed args */
	public static without<T>(array: Array<T>, ...args: T[]): Array<T>;
	public static without<T>(collection: Collection<T>, ...args: T[]): Collection<T>;
	public static without<T, U extends Array<T>>(array: U, ...args: T[]): U {
		return array.filter(obj => !args.includes(obj)) as U;
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
