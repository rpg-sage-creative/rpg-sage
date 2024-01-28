import { EphemeralBase } from "./EphemeralBase.js";

export class EphemeralMap<K, V>
		extends EphemeralBase<K, V>
		implements Map<K, V> {

	// public constructor(msToLive: number)

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.entries();
	}

	get [Symbol.toStringTag](): string {
		return "EphemeralMap";
	}

	// public get msToLive(): number

	/** sets a value to the data and then queues up the process */
	public set(key: K, value: V): this {
		return super.set(key, value);
	}

	// public clear(): void

	// public delete(key: K): boolean

	// public entries(): IterableIterator<[K, V]>

	public forEach(fn: (value: V, key: K, map: EphemeralMap<K, V>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	public get(key: K): V | undefined {
		return this.map.get(key)?.value;
	}

	// public has(key: K): boolean

	// public keys(): IterableIterator<K>

	// public get size(): number

	// public values(): IterableIterator<V>
}
