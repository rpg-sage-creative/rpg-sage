import { wrapMapIterator } from "../iterator/wrapMapIterator.js";
import { EphemeralBase } from "./EphemeralBase.js";

export class EphemeralMap<K, V>
		extends EphemeralBase<K, V>
		implements Map<K, V> {

	// public constructor(msToLive: number)

	[Symbol.iterator](): MapIterator<[K, V]> {
		return this.entries();
	}

	get [Symbol.toStringTag](): string {
		return "EphemeralMap";
	}

	// public get msToLive(): number

	/** sets a value to the data and then queues up the process */
	public override set(key: K, value: V): this {
		return super.set(key, value);
	}

	// public clear(): void

	// public delete(key: K): boolean

	/** iterate the entries as [key, value] */
	public entries(): MapIterator<[K, V]> {
		return wrapMapIterator(this.map.keys(), key => {
			return {
				value: [key, this.map.get(key)?.value!],
				skip: !this.map.has(key)
			};
		});
	}

	public forEach(fn: (value: V, key: K, map: EphemeralMap<K, V>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	public get(key: K): V | undefined {
		return this.map.get(key)?.value;
	}

	// public has(key: K): boolean

	public keys(): MapIterator<K> {
		return wrapMapIterator(this.map.keys(), key => {
			return {
				value: key,
				skip: !this.map.has(key)
			};
		});
	}

	// public get size(): number

	public values(): MapIterator<V> {
		return wrapMapIterator(this.map.keys(), key => {
			return {
				value: this.map.get(key)?.value!,
				skip: !this.has(key)
			};
		});
	}

}
