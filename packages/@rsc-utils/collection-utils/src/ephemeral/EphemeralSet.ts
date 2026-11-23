import { wrapSetIterator } from "@rsc-utils/type-utils";
import { EphemeralBase } from "./EphemeralBase.js";

export class EphemeralSet<V>
		extends EphemeralBase<V, V>
		// implements Set<V>
		{

	// public constructor(msToLive: number)

	[Symbol.iterator](): SetIterator<V> {
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

	/** iterate the entries as [key, value]; expired entries skipped - NO MUTATION. */
	public entries(): SetIterator<[V, V]> {
		const cutOff = this.getCutoff();
		return wrapSetIterator(this.map.keys(), key => {
			const entry = this.liveEntry(key, cutOff);
			return {
				value: [key, entry?.value!],
				skip: entry === undefined
			};
		});
	}

	public forEach(fn: (value: V, value2: V, set: EphemeralSet<V>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	// public has(key: K): boolean

	/** iterate the values as keys; expired entries are skipped - NO MUTATION. */
	public keys(): SetIterator<V> {
		const cutOff = this.getCutoff();
		return wrapSetIterator(this.map.keys(), key => {
			return {
				value: key,
				skip: this.liveEntry(key, cutOff) === undefined
			};
		});
	}

	// public get size(): number

	/** iterate the values; expired entries are skipped - NO MUTATION. */
	public values(): SetIterator<V> {
		const cutOff = this.getCutoff();
		const array = Array.from(this.map.keys());
		return Iterator.from({
			next: (): IteratorResult<V> => {
				while (array.length) {
					const key = array.shift();
					const entry = this.liveEntry(key!, cutOff);
					if (entry !== undefined) {
						return { value:entry.value, done:false };
					}
				}
				return { value:undefined, done: true };
			}
		});
	}

}
