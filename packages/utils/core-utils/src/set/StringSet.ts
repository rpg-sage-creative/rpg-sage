import { wrapIterableIterator } from "../iterator/wrapIterableIterator.js";
import type { Optional } from "../types/generics.js";

/**
 * A case insensitive string Set.
 */
export class StringSet implements Set<string> {
	private _values: Record<Lowercase<string>, string> = { };

	public constructor(values?: Optional<Iterable<string>>) {
		if (values) {
			for (const value of values) {
				this.add(value);
			}
		}
	}

	[Symbol.iterator](): IterableIterator<string> {
		return this.values();
	}

	get [Symbol.toStringTag](): string {
		return "StringSet";
	}

	public add(value: string): this {
		// only strings allowed
		if (typeof(value) !== "string") {
			throw new TypeError("string expected");
		}

		this._values[value.toLowerCase()] = value;

		return this;
	}

	public clear() {
		this._values = {};
	}

	public delete(value: string) {
		const { _values } = this;
		const lower = value.toLowerCase();
		if (lower in _values) {
			delete _values[lower];
			return true;
		}
		return false;
	}

	public entries(): IterableIterator<[Lowercase<string>, string]> {
		return wrapIterableIterator(Object.keys(this._values) as Lowercase<string>[], key => {
			return {
				value: [key, this._values[key]],
				skip: false
			};
		});
	}

	public forEach(fn: (value: string, value2: Lowercase<string>, set: StringSet) => unknown, thisArg?: any): void {
		for (const entry of this.entries()) {
			fn.call(thisArg, entry[1], entry[0], this);
		}
	}

	public has(key: string): boolean {
		return key.toLowerCase() in this._values;
	}

	public keys(): IterableIterator<Lowercase<string>> {
		return wrapIterableIterator(Object.keys(this._values) as Lowercase<string>[], key => {
			return {
				value: key,
				skip: false
			};
		});
	}

	public get size(): number {
		return Object.keys(this._values).length;
	}

	public values(): IterableIterator<string> {
		return wrapIterableIterator(Object.keys(this._values) as Lowercase<string>[], key => {
			return {
				value: this._values[key],
				skip: false
			};
		});
	}
}