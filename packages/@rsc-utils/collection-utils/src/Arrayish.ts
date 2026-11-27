
type Awaitable<T> = T | Promise<T>;

type OrUndefined<T> = T | undefined;

type SetLike<T> = {
	size: number;
	has(value: T): boolean;
	keys(): SetIterator<T>;
	[Symbol.iterator](): SetIterator<T>;
};

type IterableLike<T> = ArrayLike<T> | SetLike<T>;

type IsIterable<T> = Array<T> | Set<T>;

type ElementOf<I> = I extends IterableLike<infer E> ? E : never;

// splice-highest-first comparator — default .sort() is lexicographic and would remove the WRONG indexes across the 10-boundary (indexes are pre-validated integers, so no nullish/±0 handling needed)
const sortIndexesDesc = (a: number, b: number): -1 | 0 | 1 => a < b ? 1 : a > b ? -1 : 0;

// The iterators below are not mutation safe;
// If you keep adding values to the iterables they will run FOREVER
// Because these are meant for read-only uses, we are not going to try to mitigate it

abstract class ArrayishBase<T, U extends IterableLike<T>> {

	//#region event methods

	public start() { }
	public increment(count?: number): void;
	public increment() { }
	public filtered(index: number): void;
	public filtered() { }
	public finish() { }
	public found(index: number): void;
	public found() { }
	public notFound() { }

	private attachEvents(other: ArrayishBase<any, any>): this {
		["start", "increment", "filtered", "finish", "found", "notFound"]
			.forEach(key => this[key as "start"] = other[key as "start"]);
		return this;
	}

	//#endregion

	/** stores the result of isArray(this.iterable) */
	public isArray: boolean;

	/** not Array and not Set */
	public isArrayLike: boolean;

	/** stores the result of isSet(this.iterable) */
	public isSet: boolean;

	protected constructor(public iterableLike: U) {
		this.isArray = Array.isArray(iterableLike);
		this.isSet = iterableLike instanceof Set;
		this.isArrayLike = !this.isArray && !this.isSet;
	}

	* [Symbol.iterator]() { yield* this.iterator(); }

	/** gets or creates the iterable */
	protected iterator(): IsIterable<T> {
		return this.isArrayLike
			? Array.from(this.iterableLike)
			: this.iterableLike as IsIterable<T>;
	}

	// /** negative counts from the end */
	// at(index: number): T | undefined {
	// 	return this.#at(index < 0 ? this.length + index : index);
	// }

	// /** expects proper index, no negatives */
	// #at(index: number): T | undefined {
	// 	if (this.isSet) {
	// 		let i = -1;
	// 		for (const value of this.iterableLike as Set<T>) {
	// 			if (++i === index) {
	// 				return value;
	// 			}
	// 		}
	// 		return undefined;
	// 	}
	// 	return (this.iterableLike as ArrayLike<T>)[index];
	// }

	/** returns the number of items in the iterableLike of this Arrayish */
	public get length(): number {
		return this.isSet
			? (this.iterableLike as Set<T>).size
			: (this.iterableLike as ArrayLike<T>).length;
	}

	/** Create an Async Arrayish with the iterableLike of this Arrayish */
	public async() {
		return new Async<T, U>(this.iterableLike).attachEvents(this);
	}

	/** Create an Parallel Arrayish with the iterableLike of this Arrayish */
	public parallel(options?: ParallelOptions) {
		return new Parallel<T, U>(this.iterableLike, options).attachEvents(this);
	}

	/**
	 * Removes the value at the given index using .splice().
	 * Negative indexes count from the end and out-of-range is a no-op returning undefined.
	 */
	public removeAt(index: number): OrUndefined<T>;

	/**
	 * Removes the values at the given indexes using .splice(), returning them in the order the indexes were given.
	 * Duplicate indexes are spliced only once but reported once per index given, so a duplicate reports its value more than once.
	 * Negative indexes count from the end like .splice(); non-integer and out-of-range indexes remove nothing and report undefined.
	 */
	public removeAt(indexes: number[]): OrUndefined<T>[];

	public removeAt(indexOrIndexes: number | number[]): OrUndefined<T> | OrUndefined<T>[] {
		if (Array.isArray(indexOrIndexes)) {
			const length = this.length;

			// normalize indexes (negative counts from end)
			const normalizedIndexes = indexOrIndexes.map(index => {
				const normalizedIndex = index < 0 ? index + length : index;
				return Number.isInteger(normalizedIndex) && normalizedIndex >= 0 && normalizedIndex < length
					? normalizedIndex
					: undefined;
			});

			// ensure arrayLike for getting value by index
			const iterableLike = this.isSet ? Array.from(this.iterableLike as Set<T>) : this.iterableLike as ArrayLike<T>;

			// map removed values by index
			const removedValues = normalizedIndexes.map(index => index === undefined ? undefined : iterableLike[index]);

			// we only want to splice each index once
			const uniqueIndexes = new Set(normalizedIndexes.filter((index): index is number => index !== undefined));

			// sort indexes desc to safely splice
			[...uniqueIndexes].sort(sortIndexesDesc).forEach(index => this.splice(index, 1));

			return removedValues;
		}

		// splice and return the single given index
		return this.splice(indexOrIndexes, 1)[0];
	}

	/** operates as Array.slice */
	public slice(start?: number, end?: number): T[] {
		// use the built in Array.slice
		if (this.isArray) {
			return (this.iterableLike as Array<T>).slice(start, end);
		}

		// set has to be converted for slice to work
		if (this.isSet) {
			// convert the set to an array
			return Array.from(this.iterableLike as Set<T>).slice(start, end);
		}

		// ArrayLike may not have the slice function, so use it via the prototype
		return Array.prototype.slice.call(this.iterableLike as ArrayLike<T>, start, end);

		/*
		// IN CASE WE NEED TO OPTIMIZE FOR LARGE SETS

		// no args creates a new array
		if (start === undefined && end === undefined) {
			return Array.from(this.iterable);
		}

		// calculate actual start/end indexes
		const { length } = this;
		const startIndex = start ? start < 0 ? start + length : start : 0;
		const endIndex = end ? end < 0 ? end + length : end : 0;

		// if end index is less than start index, return a new array
		if (endIndex <= startIndex) {
			return [];
		}

		const sliced: T[] = [];
		const arrayLike = this.toArrayLike();
		const minIndex = Math.max(startIndex, 0);
		const maxIndex = Math.min(endIndex, length);
		for (let index = minIndex; index < maxIndex; index++) {
			sliced.push(arrayLike[index]);
		}
		return sliced;
		*/
	}

	/** operates as Array.splice */
	public splice(start: number, deleteCount: number): T[] {
		if (this.isArray) {
			return (this.iterableLike as Array<T>).splice(start, deleteCount);
		}

		// set has to be converted for splice to work
		if (this.isSet) {
			// cast as set
			const thisSet = this.iterableLike as Set<T>;

			// convert the set to an array to splice
			const removed = Array.from(thisSet).splice(start, deleteCount);

			// remove items from original
			removed.forEach(value => thisSet.delete(value));

			return removed;
		}

		// ArrayLike may not have the slice function, so use it via the prototype
		return Array.prototype.splice.call(this.iterableLike as ArrayLike<T>, start, deleteCount);
	}

	/** Creates a new Array from the iterableLike of this Arrayish */
	public toArray(): Array<T> {
		return this.isArray
			? (this.iterableLike as Array<T>).slice()
			: Array.from(this.iterableLike);
	}

	/** Creates a new Set from the iterableLike of this Arrayish */
	public toSet(): Set<T> {
		return new Set(this.iterator());
	}

}

export class Arrayish<T, U extends IterableLike<T> = IterableLike<T>> extends ArrayishBase<T, U> {

	/** operates as Array.filter */
	public filter(
		predicate: (value: T, index: number, iterableLike: U) => unknown,
		thisArg?: any,
	): T[] {

		const { iterableLike } = this;
		const outValues: T[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			if (predicate.call(thisArg, value, ++index, iterableLike)) {
				outValues.push(value);
				this.filtered(index);
			}
			this.increment();
		}

		this.finish();
		return outValues;
	}

	/** performs a .filter().map() with a single iteration */
	public filterAndMap<V>(
		predicate: (value: T, index: number, iterableLike: U) => unknown,
		callbackfn: (value: T, index: number, iterableLike: U) => V,
		thisArg?: any,
	): V[] {

		const { iterableLike } = this;
		const outValues: V[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			if (predicate.call(thisArg, value, ++index, iterableLike)) {
				outValues.push(callbackfn.call(thisArg, value, index, iterableLike));
				this.filtered(index);
			}
			this.increment();
		}

		this.finish();
		return outValues;
	}

	/** operates as Array.find */
	public find(
		predicate: (value: T, index: number, iterableLike: U) => unknown,
		thisArg?: any,
	): OrUndefined<T> {

		const { iterableLike } = this;
		this.start();

		// start at -1 and use ++index; ensures this.found(index) has the correct index
		let index = -1;
		for (const value of this) {
			if (predicate.call(thisArg, value, ++index, iterableLike)) {
				this.found(index);
				return value;
			}
			this.increment();
		}

		this.notFound();
		return undefined;
	}

	/** like forEach, but in batches */
	public forBatch(
		batchSize: number,
		callbackfn: (values: T[], startIndex: number, iterableLike: U) => void,
		thisArg?: any,
	): void {

		const { iterableLike } = this;
		this.start();

		const array = this.isArray ? (iterableLike as Array<T>).slice() : Array.from(iterableLike);

		let startIndex = 0;
		let batchLength = 0;
		do {
			const batch = array.slice(startIndex, startIndex + batchSize);
			if (batchLength = batch.length) {
				callbackfn.call(thisArg, batch, startIndex, iterableLike);
				this.increment(batchLength);
				startIndex += batchLength;
			}
		}while (batchLength);

		this.finish();
	}

	/** operates as Array.forEach */
	public forEach(
		callbackfn: (value: T, index: number, iterableLike: U) => void,
		thisArg?: any,
	): void {

		const { iterableLike } = this;
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			callbackfn.call(thisArg, value, ++index, iterableLike);
			this.increment();
		}

		this.finish();
	}

	/** operates as Array.map */
	public map<V>(
		callbackfn: (value: T, index: number, iterableLike: U) => V,
		thisArg?: any,
	): V[] {

		const { iterableLike } = this;
		const outValues: V[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			outValues.push(callbackfn.call(thisArg, value, ++index, iterableLike));
			this.increment();
		}

		this.finish();
		return outValues;
	}

	/**
	 * Iterates the given array and returns the first mapped value returned from callbackfn that is !== null and !== undefined.
	 * A convenience method for array.map(callbackfn).find(obj => obj !== null && obj !== undefined) that uses a single iteration.
	 * Triggers .found(index) if a value other than undefined is returned.
	 */
	public mapFirst<V>(
		callbackfn: (value: T, index: number, iterableLike: U) => V,
		thisArg?: any,
	): OrUndefined<V> {

		const { iterableLike } = this;
		this.start();

		// start at -1 and use ++index; ensures this.found(index) has the correct index
		let index = -1;
		for (const value of this) {
			const outValue = callbackfn.call(thisArg, value, ++index, iterableLike);
			if (outValue !== null && outValue !== undefined) {
				this.found(index);
				return outValue;
			}
			this.increment();
		}

		this.notFound();
		return undefined;
	}

	/** Partitions the values into nested Arrays based on the partitionfn */
	public partition(
		partitionfn: (value: T, index: number, arrayLike: U) => number,
		thisArg?: any,
	): T[][] {

		const { iterableLike } = this;
		const partitioned: T[][] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			const partIndex = partitionfn.call(thisArg, value, ++index, iterableLike);
			if (!partitioned[partIndex]) {
				partitioned[partIndex] = [];
			}
			partitioned[partIndex].push(value);
		}

		this.finish();
		return partitioned;
	}

	/**
	 * Removes the values that return a truthy value from the predicate, in place.
	 * Returns the removed values in original order, including null and undefined entries.
	 */
	public remove(
		predicate: (value: T, index: number, iterableLike: U) => unknown,
		thisArg?: any,
	): T[] {

		const { iterableLike } = this;
		const indexes: number[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			if (predicate.call(thisArg, value, ++index, iterableLike)) {
				indexes.push(index);
				this.filtered(index);
			}
			this.increment();
		}

		// splicing via reduceRight safely avoids duplicate removal
		const removed = indexes.reduceRight((removed, indexToRemove, removedIndex) => {
			removed[removedIndex] = this.splice(indexToRemove, 1)[0];
			return removed;
		}, [] as T[]);

		this.finish();
		return removed;
	}

	//#region static functions

	/** Creates a new Arrayish for the given IterableLike */
	public static from<U extends IterableLike<any>>(iterableLike: U): Arrayish<ElementOf<U>, U> {
		const constr = this ?? Arrayish;
		return new constr(iterableLike);
	}

	/** Creates a new Async Arrayish for the given IterableLike */
	public static async<U extends IterableLike<any>>(iterableLike: U): Async<ElementOf<U>, U> {
		return new Async(iterableLike);
	}

	/** Creates a new Parallel Arrayish for the given IterableLike */
	public static parallel<U extends IterableLike<any>>(iterableLike: U, options: ParallelOptions): Parallel<ElementOf<U>, U> {
		return new Parallel(iterableLike as U, options);
	}

	//#endregion
}

class Async<T, U extends IterableLike<T> = IterableLike<T>> extends ArrayishBase<T, U> {

	/** operates as Array.filter */
	public async filter(
		predicate: (value: T, index: number, iterableLike: U) => Awaitable<unknown>,
		thisArg?: any,
	): Promise<T[]> {

		const { iterableLike } = this;
		const outValues: T[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			if (await predicate.call(thisArg, value, ++index, iterableLike)) {
				outValues.push(value);
				this.filtered(index);
			}
			this.increment();
		}

		this.finish();
		return outValues;
	}

	/** Ignores concurrency to ensure the returned value is the lowest index to return truthy. */
	public async find(
		predicate: (value: T, index: number, iterableLike: U) => Awaitable<unknown>,
		thisArg?: any,
	): Promise<OrUndefined<T>> {

		const { iterableLike } = this;
		this.start();

		// start at -1 and use ++index; ensures this.found(index) has the correct index
		let index = -1;
		for (const value of this) {
			if (await predicate.call(thisArg, value, ++index, iterableLike)) {
				this.found(index);
				return value;
			}
			this.increment();
		}

		this.notFound();
		return undefined;
	}

	/** batch iteration, like forEach, but in batches */
	public async forBatch(
		batchSize: number,
		callbackfn: (values: T[], startIndex: number, iterableLike: U) => Awaitable<void>,
		thisArg?: any,
	): Promise<void> {

		const { iterableLike, length } = this;
		this.start();

		const array = this.isArray ? (iterableLike as Array<T>).slice() : Array.from(iterableLike);

		let startIndex = 0;
		let batchLength = 0;
		do {
			const batch = array.slice(startIndex, startIndex + batchSize);
			if (batchLength = batch.length) {
				await callbackfn.call(thisArg, batch, startIndex, iterableLike);
				this.increment(batchLength);
				startIndex += batchLength;
			}
		}while (startIndex < length && batchLength);

		this.finish();
	}

	/** operates as Array.forEach */
	public async forEach(
		callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<void>,
		thisArg?: any,
	): Promise<void> {

		const { iterableLike } = this;
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			await callbackfn.call(thisArg, value, ++index, iterableLike);
			this.increment();
		}

		this.finish();
	}

	/** operates as Array.map */
	public async map<V>(
		callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<V>,
		thisArg?: any,
	): Promise<V[]> {

		const { iterableLike } = this;
		const outValues: V[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			index++;
			outValues[index] = await callbackfn.call(thisArg, value, index, iterableLike);
			this.increment();
		}

		this.finish();
		return outValues;
	}

}

type ParallelOptions = {
	/** default = Infinity (for all) */
	concurrency: number;
};

class Parallel<T, U extends IterableLike<T> = IterableLike<T>> extends ArrayishBase<T, U> {

	public constructor(iterableLike: U, public options?: ParallelOptions) {
		super(iterableLike);
	}

	/** operates as Array.forEach */
	public async forEach(
		callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<void>,
		thisArg?: any,
	): Promise<void> {

		const { iterableLike, length } = this;
		this.start();

		// max number of promises to make
		const concurrency = this.options?.concurrency ?? Infinity;

		// we need an indexable object to get the value, so a Set must be converted
		const arrayLike = this.isSet ? Array.from(iterableLike) : iterableLike as ArrayLike<T>;

		// tracks next index to send to callbackfn
		let cursor = 0;

		// creates X promises, where X is Math.min(concurrency, length)
		await Promise.all(
			Array.from({ length: Math.min(concurrency, length) }, async () => {
				while (cursor < length) {
					const index = cursor++;
					await callbackfn.call(thisArg, arrayLike[index] as T, index, iterableLike);
					this.increment();
				}
			})
		);

		this.finish();
	}

	/** operates as Array.map */
	public async map<V>(
		callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<V>,
		thisArg?: any,
	): Promise<V[]> {

		const { iterableLike, length } = this;
		const outValues: V[] = [];
		this.start();

		// max number of promises to make
		const concurrency = this.options?.concurrency ?? 1;

		// we need an indexable object to get the value, so a Set must be converted
		const arrayLike = this.isSet ? Array.from(iterableLike) : iterableLike as ArrayLike<T>;

		// tracks next index to send to callbackfn
		let cursor = 0;

		// creates X promises, where X is Math.min(concurrency, length)
		await Promise.all(
			Array.from({ length: Math.min(concurrency, length) }, async () => {
				while (cursor < length) {
					const index = cursor++;
					outValues[index] = await callbackfn.call(thisArg, arrayLike[index] as T, index, iterableLike);
					this.increment();
				}
			})
		);

		this.finish();
		return outValues;
	}

}
