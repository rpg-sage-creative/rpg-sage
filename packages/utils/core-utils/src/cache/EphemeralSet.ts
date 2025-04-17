import { EphemeralBase } from "./EphemeralBase.js";

export class EphemeralSet<V>
		extends EphemeralBase<V, V>
		implements Set<V> {

	// public constructor(msToLive: number)

	[Symbol.iterator](): IterableIterator<V> {
		return this.values();
	}

	get [Symbol.toStringTag](): string {
		return "EphemeralSet";
	}

	// public get msToLive(): number

	/** adds a value to the data and then queues up the process */
	public add(value: V): this {
		return this.set(value, value);
	}

	// public clear(): void

	// public delete(key: K): boolean

	// public entries(): IterableIterator<[K, V]>

	public forEach(fn: (value: V, value2: V, set: EphemeralSet<V>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	// public has(key: K): boolean

	// public keys(): IterableIterator<K>

	// public get size(): number

	// public values(): IterableIterator<V>
}
