
import type { Awaitable, OrUndefined } from "@rsc-utils/type-utils";

type IterableLike<T> = ArrayLike<T> | Set<T>;

export class GenericIterable<T> {

	//#region protected methods for child classes

	protected start() { }
	protected increment(count?: number): void;
	protected increment() { }
	protected finish() { }
	protected found() { }
	protected notFound() { }

	//#endregion

	public constructor(public iterable: IterableLike<T>) { }

	/** A shortcut for creating new instances, including child classes. */
	public static from<T>(iterable: IterableLike<T>) {
		// use the current Class (GenericIterable or extended child class), fall back to GenericIterable
		const constr = this ?? GenericIterable;
		return new constr(iterable);
	}

	public get length(): number {
		const { iterable } = this;
		return "length" in iterable ? iterable.length : iterable.size;
	}

	public slice(start?: number, end?: number): T[] {
		const { iterable } = this;
		return "length" in iterable
			? Array.prototype.slice.call(iterable, start, end)
			: Array.from(iterable).slice(start, end);
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

	//#region batch iteration, like forEach, but in batches

	public forBatch(batchSize: number, callbackfn: (value: T[], startIndex: number, iterable: IterableLike<T>) => void, thisArg?: any): void {
		this.start();
		let startIndex = 0;
		let batchLength = 0;
		const { iterable, length } = this;
		const arrayLike = "length" in iterable ? iterable : Array.from(iterable);
		do {
			const batch = Array.prototype.slice.call(arrayLike, startIndex, startIndex + batchSize);
			batchLength = batch.length;
			if (batchLength) {
				callbackfn.call(thisArg, batch, startIndex, iterable);
				this.increment(batchLength);
				startIndex += batchLength;
			}
		}while (startIndex < length && batchLength);
		this.finish();
	}

	public async forBatchAsync(batchSize: number, callbackfn: (value: T[], startIndex: number, iterable: IterableLike<T>) => Awaitable<void>, thisArg?: any): Promise<void> {
		this.start();
		let startIndex = 0;
		let batchLength = 0;
		const { iterable, length } = this;
		const arrayLike = "length" in iterable ? iterable : Array.from(iterable);
		do {
			const batch = Array.prototype.slice.call(arrayLike, startIndex, startIndex + batchSize);
			batchLength = batch.length;
			if (batchLength) {
				await callbackfn.call(thisArg, batch, startIndex, iterable);
				this.increment(batchLength);
				startIndex += batchLength;
			}
		}while (startIndex < length && batchLength);
		this.finish();
	}

	//#endregion

	public find(predicate: (value: T, index: number, iterable: IterableLike<T>) => unknown, thisArg?: any): OrUndefined<T> {
		this.start();
		let index = 0;
		const { iterable } = this;
		for (const value of iterable as T[]) {
			if (predicate.call(thisArg, value, index++, iterable)) {
				this.found();
				return value;
			}
			this.increment();
		}
		this.notFound();
		return undefined;
	}

	public async findAsync(predicate: (value: T, index: number, iterable: IterableLike<T>) => Awaitable<unknown>, thisArg?: any): Promise<OrUndefined<T>> {
		this.start();
		let index = 0;
		const { iterable } = this;
		for (const value of iterable as T[]) {
			if (await predicate.call(thisArg, value, index++, iterable)) {
				this.found();
				return value;
			}
			this.increment();
		}
		this.notFound();
		return undefined;
	}

	public forEach(callbackfn: (value: T, index: number, iterable: IterableLike<T>) => void, thisArg?: any): void {
		this.start();
		let index = 0;
		const { iterable } = this;
		for (const value of iterable as T[]) {
			callbackfn.call(thisArg, value, index++, iterable);
			this.increment();
		}
		this.finish();
	}

	public async forEachAsync(callbackfn: (value: T, index: number, iterable: IterableLike<T>) => Awaitable<void>, thisArg?: any): Promise<void> {
		this.start();
		let index = 0;
		const { iterable } = this;
		for (const value of iterable as T[]) {
			await callbackfn.call(thisArg, value, index++, iterable);
			this.increment();
		}
		this.finish();
	}

	public filter(predicate: (value: T, index: number, iterable: IterableLike<T>) => unknown, thisArg?: any): T[] {
		this.start();
		let index = 0;
		const { iterable } = this;
		const outValues: T[] = [];
		for (const value of iterable as T[]) {
			if (predicate.call(thisArg, value, index++, iterable)) {
				outValues.push(value);
			}
			this.increment();
		}
		this.finish();
		return outValues;
	}

	public async filterAsync(predicate: (value: T, index: number, iterable: IterableLike<T>) => Awaitable<unknown>, thisArg?: any): Promise<T[]> {
		this.start();
		let index = 0;
		const { iterable } = this;
		const outValues: T[] = [];
		for (const value of iterable as T[]) {
			if (await predicate.call(thisArg, value, index++, iterable)) {
				outValues.push(value);
			}
			this.increment();
		}
		this.finish();
		return outValues;
	}

	public map
			<U, V extends T = T>
			(callbackfn: (value: T, index: number, iterable: IterableLike<V>) => U, thisArg?: any)
			: U[] {
		this.start();
		let index = 0;
		const { iterable } = this;
		const outValues: U[] = [];
		for (const value of iterable as V[]) {
			outValues.push(callbackfn.call(thisArg, value, index++, iterable as V[]));
			this.increment();
		}
		this.finish();
		return outValues;
	}

	public async mapAsync
			<U, V extends T = T>
			(callbackfn: (value: T, index: number, iterable: IterableLike<V>) => Awaitable<U>, thisArg?: any)
			: Promise<U[]> {
		this.start();
		let index = 0;
		const { iterable } = this;
		const outValues: U[] = [];
		for (const value of iterable as V[]) {
			outValues.push(await callbackfn.call(thisArg, value, index++, iterable as V[]));
			this.increment();
		}
		this.finish();
		return outValues;
	}

	/**
	 * Iterates the given array and returns the first mapped value returned from callbackfn that is !== null and !== undefined.
	 * A convenience method for array.map(callbackfn).find(obj => obj !== null && obj !== undefined) that uses a single iteration.
	 * Triggers .found() if a value other than undefined is returned.
	 */
	public mapFirst
			<U, V extends T = T>
			(callbackfn: (value: T, index: number, iterable: IterableLike<V>) => U, thisArg?: any)
			: OrUndefined<U> {
		this.start();
		let index = 0;
		const { iterable } = this;
		for (const value of iterable as V[]) {
			const outValue = callbackfn.call(thisArg, value, index++, iterable as V[]);
			if (outValue !== null && outValue !== undefined) {
				this.found();
				return outValue;
			}
			this.increment();
		}
		this.notFound();
		return undefined;
	}
}
