
type Awaitable<T> = T | Promise<T>;
type OrUndefined<T> = T | undefined;

type IterableLike<T> = ArrayLike<T> | Set<T>;
type IsIterable<T> = Array<T> | Set<T>;
type ElementOf<I> = I extends IterableLike<infer E> ? E : never;

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
			.forEach(key => other[key as "start"] = this[key as "start"]);
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
	public parallel(options: ParallelOptions) {
		return new Parallel<T, U>(this.iterableLike, options).attachEvents(this);
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

	public filter(
			predicate: (value: T, index: number, iterableLike: U) => unknown,
			thisArg?: any): T[] {
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
			thisArg?: any): V[] {
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

	public find(
			predicate: (value: T, index: number, iterableLike: U) => unknown,
			thisArg?: any): OrUndefined<T> {
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
			thisArg?: any): void {
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

	public forEach(
			callbackfn: (value: T, index: number, iterableLike: U) => void,
			thisArg?: any): void {
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

	public map<V>(
			callbackfn: (value: T, index: number, iterableLike: U) => V,
			thisArg?: any): V[] {
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
			thisArg?: any): OrUndefined<V> {
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

	public async filter(predicate: (value: T, index: number, iterableLike: U) => Awaitable<unknown>, thisArg?: any): Promise<T[]> {
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
	public async find(predicate: (value: T, index: number, iterableLike: U) => Awaitable<unknown>, thisArg?: any): Promise<OrUndefined<T>> {
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
	public async forBatch(batchSize: number, callbackfn: (values: T[], startIndex: number, iterableLike: U) => Awaitable<void>, thisArg?: any): Promise<void> {
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

	public async forEach(callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<void>, thisArg?: any): Promise<void> {
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

	public async map<V>(callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<V>, thisArg?: any): Promise<V[]> {
		const { iterableLike } = this;
		const outValues: V[] = [];
		this.start();

		// start at -1 and use ++index
		let index = -1;
		for (const value of this) {
			outValues.push(await callbackfn.call(thisArg, value, ++index, iterableLike));
			this.increment();
		}

		this.finish();
		return outValues;
	}

}

type ParallelOptions = {
	/** default 1, Infinity for all */
	concurrency: number;
};

class Parallel<T, U extends IterableLike<T> = IterableLike<T>> extends ArrayishBase<T, U> {

	public constructor(iterableLike: U, public options: ParallelOptions) {
		super(iterableLike);
	}

	public async forEach(callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<void>, thisArg?: any): Promise<void> {
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

	public async map<V>(callbackfn: (value: T, index: number, iterableLike: U) => Awaitable<V>, thisArg?: any): Promise<V[]> {
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
					outValues.push(await callbackfn.call(thisArg, arrayLike[index] as T, index, iterableLike));
					this.increment();
				}
			})
		);

		this.finish();
		return outValues;
	}

}
