import type { Optional } from "../..";
import CoreCache from "./CoreCache";
import SuperClass from "./SuperClass";
import type { Core } from "./types";

export function toJSON<T extends Core<U>, U extends string = string, V extends HasCore<T> = HasCore<T>, W extends T | V = T | V>(objectOrCore: W): T {
	return "toJSON" in objectOrCore ? objectOrCore.toJSON() : objectOrCore as T;
}

/** Abstract Class with properties and methods related to the Core or objectType */
export default abstract class HasCore<T extends Core<U>, U extends string = string> extends SuperClass {

	/** Provides a caching mechanism for all HasCore classes. */
	protected get cache(): CoreCache { return this._cache ?? (this._cache = new CoreCache()); }
	private _cache: CoreCache | undefined;

	/** Must have a core. */
	public constructor(protected core: T) {
		super();
	}

	//protected setOrDelete<U extends keyof T, V extends typeof this.core[U]>(key: U, value: Optional<V>): void {
	/** Sets the core's value, or deletes the key from the core if null or undefined. */
	protected setOrDelete<V extends keyof T, W = any>(key: V, value: Optional<W>): void {
		if (value === null || value === undefined) {
			delete this.core[key];
		}else {
			this.core[key] = value as any;
		}
	}

	/** The type of data that is represented. Often the Class that the Core is for. */
	public get objectType(): U {
		return this.core.objectType;
	}

	/** Returns true if the given object is this object's core. */
	public is(object: T): boolean;
	/** Returns true if the given object is this object. */
	public is(object: HasCore<T, U>): boolean;
	public is(object: HasCore<T, U> | T): boolean {
		return object === this
			|| object === this.core
			|| object && (object as HasCore<T, U>).core === this.core;
	}

	/** Returns this object's core. */
	public toJSON(): T {
		return this.core;
	}

	public static toJSON<T extends Core<U>, U extends string = string, V extends HasCore<T> = HasCore<T>, W extends T | V = T | V>(value: W): T {
		return toJSON(value);
	}
}
