import { isDefined, toUniqueDefined } from "@rsc-utils/core-utils";
import XRegExp from "xregexp";
import Collection from "./utils/Collection.js";

export interface IHasSave {
	save(): Promise<boolean>;
}

interface IHasName {
	name: string;
}

/** @deprecated Move where needed or create a mixin. */
export class NamedCollection<T extends IHasName> extends Collection<T> {

	/** The owner of this collection that can be saved when changes are made. */
	protected owner?: IHasSave;

	/** Empties this Collection and then calls owner.save() */
	public emptyAndSave(): Promise<boolean> {
		if (this.length) {
			this.empty();
			return this.owner?.save() ?? Promise.resolve(true);
		}
		return Promise.resolve(false);
	}

	/** Finds the value by (case insensitive) name. */
	public findByName(name: string, ignoreCase = true): T | undefined {
		if (!name) {
			return undefined;
		}
		const regex = XRegExp(`^${XRegExp.escape(name)}$`, ignoreCase ? "i" : undefined);
		return this.find(value => regex.test(value.name));
	}

	/** We likely don't want a NamedCollection if we map to a non-named value. */
	public map<U>(callbackfn: (value: T, index: number, collection: NamedCollection<T>) => U, thisArg?: any): Collection<U> {
		const mapped = new Collection<U>();
		this.forEach((value, index, collection) => mapped.push(callbackfn.call(thisArg, value, index, collection)));
		return mapped;
	}

	/** If the value's name already exists, this fails and returns false. */
	public pushAndSave(value: T): Promise<boolean> {
		const found = this.findByName(value.name);
		if (!found) {
			this.push(value);
			return this.owner?.save() ?? Promise.resolve(true);
		}
		return Promise.resolve(false);
	}

	/** Removes all of the given objects (by reference) and then calls owner.save() if the length changed. */
	public removeAndSave(...values: T[]): Promise<boolean> {
		const length = this.length;
		values.filter(isDefined).forEach(value => {
			const index = this.indexOf(value);
			if (index > -1) {
				this.splice(index, 1);
			}
		});
		if (length !== this.length) {
			return this.owner?.save() ?? Promise.resolve(true);
		}
		return Promise.resolve(false);
	}

	/** Finds the objects for the given names and then calls removeAndSave(...values). */
	public removeByName(...names: string[]): Promise<boolean> {
		const found = names.map(name => this.findByName(name))
			.filter(toUniqueDefined);
		return this.removeAndSave(...found);
	}

	/** Creates a new NamedCollection from the given values and optional owner. */
	public static from<T extends IHasName>(arrayLike: ArrayLike<T> | Iterable<T>): NamedCollection<T>;
	public static from<T extends IHasName>(arrayLike: ArrayLike<T> | Iterable<T>, owner: IHasSave): NamedCollection<T>;
	public static from<T extends IHasName>(other: NamedCollection<T>): NamedCollection<T>;
	public static from<T extends IHasName>(other: NamedCollection<T>, owner: IHasSave): NamedCollection<T>;
	public static from<T extends IHasName>(values: ArrayLike<T> | Iterable<T> | NamedCollection<T>, owner?: IHasSave): NamedCollection<T> {
		const namedCollection = new NamedCollection<T>();
		namedCollection.owner = owner ?? undefined;
		if (values instanceof NamedCollection) {
			namedCollection.owner = owner ?? values.owner ?? undefined;
			namedCollection.push(...values);
		}else if (values) {
			namedCollection.push(...Array.from(values));
		}
		return namedCollection;
	}
}

// Update the Collection signatures to indicate that we are now returning a NamedCollection
export interface NamedCollection<T extends IHasName> {

	concat(...items: ConcatArray<T>[]): NamedCollection<T>;
	concat(...items: (T | ConcatArray<T>)[]): NamedCollection<T>;

	filter(predicate: (value: T, index: number, collection: NamedCollection<T>) => unknown, thisArg?: any): NamedCollection<T>;
	filter<S extends T>(predicate: (value: T, index: number, collection: NamedCollection<T>) => value is S, thisArg?: any): NamedCollection<S>;

	forEach(callbackfn: (value: T, index: number, collection: NamedCollection<T>) => void, thisArg?: any): void;

	map<U>(callbackfn: (value: T, index: number, collection: NamedCollection<T>) => U, thisArg?: any): Collection<U>;

	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: NamedCollection<T>) => T): T;
	reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: NamedCollection<T>) => T, initialValue: T): T;
	reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, collection: NamedCollection<T>) => U, initialValue: U): U;

	reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: NamedCollection<T>) => T): T;
	reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, collection: NamedCollection<T>) => T, initialValue: T): T;
	reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, collection: NamedCollection<T>) => U, initialValue: U): U;

	reverse(): this;

	slice(start?: number, end?: number): NamedCollection<T>;

	splice(start: number, deleteCount?: number): NamedCollection<T>;
	splice(start: number, deleteCount: number, ...items: T[]): NamedCollection<T>;
}
