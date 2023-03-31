import type { Optional } from "..";
import { SuperClass } from "./SuperClass";

//#region types

/** The most basic Core used. */
export interface Core<T extends string = string> {
	/** The type of data that is represented. Often the Class that the Core is for. */
	objectType: T;
}

//#endregion

//#region helpers

export function toJSON<T extends Core<U>, U extends string = string, V extends HasCore<T> = HasCore<T>, W extends T | V = T | V>(objectOrCore: W): T {
	return "toJSON" in objectOrCore ? objectOrCore.toJSON() : objectOrCore as T;
}

//#endregion

/** Abstract Class with properties and methods related to the Core or objectType */
export abstract class HasCore<T extends Core<U>, U extends string = string> extends SuperClass {

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
