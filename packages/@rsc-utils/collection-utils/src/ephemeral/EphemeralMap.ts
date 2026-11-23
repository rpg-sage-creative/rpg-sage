import { wrapMapIterator } from "@rsc-utils/type-utils";
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

	/** iterate the entries as [key, value]; expired entries skipped - NO MUTATION. */
	public entries(): MapIterator<[K, V]> {
		const cutOff = this.getCutoff();
		return wrapMapIterator(this.map.keys(), key => {
			const entry = this.liveEntry(key, cutOff);
			return {
				value: [key, entry?.value!],
				skip: entry === undefined
			};
		});
	}

	public forEach(fn: (value: V, key: K, map: EphemeralMap<K, V>) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	/**
	 * Returns the value for the key, or undefined when missing OR expired.
	 * Expired entries are deleted.
	 */
	public get(key: K): V | undefined {
		return this.takeLiveEntry(key)?.value;
	}

	// public has(key: K): boolean

	/** iterate the keys; expired entries are skipped - NO MUTATION. */
	public keys(): MapIterator<K> {
		const cutOff = this.getCutoff();
		return wrapMapIterator(this.map.keys(), key => {
			return {
				value: key,
				skip: this.liveEntry(key, cutOff) === undefined
			};
		});
	}

	// public get size(): number

	/** iterate the values; expired entries are skipped - NO MUTATION. */
	public values(): MapIterator<V> {
		const cutOff = this.getCutoff();
		return wrapMapIterator(this.map.keys(), key => {
			const entry = this.liveEntry(key, cutOff);
			return {
				value: entry?.value!,
				skip: entry === undefined
			};
		});
	}

}
