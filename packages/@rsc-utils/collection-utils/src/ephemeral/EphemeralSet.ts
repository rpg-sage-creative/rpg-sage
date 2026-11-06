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

	/** iterate the entries as [key, value] */
	public entries(): SetIterator<[V, V]> {
		return wrapSetIterator(this.map.keys(), key => {
			return {
				value: [key, this.map.get(key)?.value!],
				skip: !this.map.has(key)
			};
		});
	}

	public forEach(fn: (value: V, value2: V, set: EphemeralSet<V>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	// public has(key: K): boolean

	public keys(): SetIterator<V> {
		return wrapSetIterator(this.map.keys(), key => {
			return {
				value: key,
				skip: !this.map.has(key)
			};
		});
	}

	// public get size(): number

	public values(): SetIterator<V> {
		const array = Array.from(this.map.keys());
		return Iterator.from({
			next: (): IteratorResult<V> => {
				while (array.length) {
					const key = array.shift();
					const value = this.map.get(key!)?.value!;
					const skip = !this.has(key!);
					if (!skip) {
						return { value, done:false };
					}
				}
				return { value:undefined, done: true };
			}
		});
	}

}
