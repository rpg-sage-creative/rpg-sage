import { wrapSetIterator } from "../iterator/wrapSetIterator.js";
import type { Optional } from "../types/generics.js";

type SetLike<T> = {
	size: number;
	has(value: T): boolean;
	keys(): SetIterator<T>;
	[Symbol.iterator](): SetIterator<T>;
};

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

	[Symbol.iterator](): SetIterator<string> {
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

		this._values[value.toLowerCase()] ??= value;

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

	/** values in this but not in other */
	public difference(other: SetLike<string>): StringSet {
		const difference = new StringSet();

		const otherSet = other instanceof StringSet ? other : new StringSet(other);

		if (this.size > otherSet.size) {
			for (const [key, value] of otherSet.entries()) {
				if (!this.hasKey(key)) {
					difference.add(value);
				}
			}

		}else {
			for (const [key, value] of this.entries()) {
				if (!otherSet.hasKey(key)) {
					difference.add(value);
				}
			}
		}

		return difference;
	}

	public entries(): SetIterator<[Lowercase<string>, string]> {
		return wrapSetIterator(Object.keys(this._values) as Lowercase<string>[], key => {
			return {
				value: [key, this._values[key]!],
				skip: false
			};
		});
	}

	public forEach(fn: (value: string, value2: Lowercase<string>, set: StringSet) => unknown, thisArg?: any): void {
		for (const [key, value] of this.entries()) {
			fn.call(thisArg, value, key, this);
		}
	}

	public has(value: string): boolean {
		return value.toLowerCase() in this._values;
	}

	protected hasKey(key: Lowercase<string>): boolean {
		return key in this._values;
	}

	/** values in this and in other */
	public intersection(other: SetLike<string>): StringSet {
		const intersection = new StringSet();

		const otherSet = other instanceof StringSet ? other : new StringSet(other);

		if (this.size > otherSet.size) {
			for (const [key, value] of otherSet.entries()) {
				if (this.hasKey(key)) {
					intersection.add(value);
				}
			}

		}else {
			for (const [key, value] of this.entries()) {
				if (otherSet.hasKey(key)) {
					intersection.add(value);
				}
			}

		}

		return intersection;
	}

	/** true if this set has no elements in common with the other set, and false otherwise. */
	public isDisjointFrom(other: SetLike<string>): boolean {
		if (this.size > other.size) {
			for (const value of other) {
				if (this.has(value)) {
					return false;
				}
			}

		}else {
			const otherSet = other instanceof StringSet ? other : new StringSet(other);
			for (const key of this.keys()) {
				if (otherSet.hasKey(key)) {
					return false;
				}
			}

		}
		return true;
	}

	/** true if all elements in this set are also in the other set, and false otherwise. */
	public isSubsetOf(other: SetLike<string>): boolean {
		if (this.size > other.size) {
			return false;
		}

		const otherSet = other instanceof StringSet ? other : new StringSet(other);

		for (const key of this.keys()) {
			if (!otherSet.hasKey(key)) {
				return false;
			}
		}

		return true;
	}

	/** true if all elements in the other set are also in this set, and false otherwise. */
	public isSupersetOf(other: SetLike<string>) {
		if (this.size < other.size) {
			return false;
		}

		const otherSet = other instanceof StringSet ? other : new StringSet(other);

		for (const key of otherSet.keys()) {
			if (!this.hasKey(key)) {
				return false;
			}
		}

		return true;
	}

	public keys(): SetIterator<Lowercase<string>> {
		return wrapSetIterator(Object.keys(this._values) as Lowercase<string>[], key => {
			return {
				value: key,
				skip: false
			};
		});
	}

	public get size(): number {
		return Object.keys(this._values).length;
	}

	/** A new StringSet object containing elements which are in either this set or the other set, but not in both. */
	public symmetricDifference(other: SetLike<string>): StringSet {
		const symmetricDifference = new StringSet();

		const otherSet = other instanceof StringSet ? other : new StringSet(other);

		for (const [key, value] of this.entries()) {
			if (!otherSet.has(key)) {
				symmetricDifference.add(value);
			}
		}

		for (const [key, value] of otherSet.entries()) {
			if (!this.has(key)) {
				symmetricDifference.add(value);
			}
		}

		return symmetricDifference;
	}

	/** A new StringSet object containing elements which are in either or both of this set and the other set. */
	public union(other: SetLike<string>) {
		const union = new StringSet(this);

		for (const value of other) {
			union.add(value);
		}

		return union;
	}

	public values(): SetIterator<string> {
		return wrapSetIterator(Object.keys(this._values) as Lowercase<string>[], key => {
			return {
				value: this._values[key]!,
				skip: false
			};
		});
	}

	public static from(setLike: SetLike<string>): StringSet {
		return new StringSet(setLike);
	}
}