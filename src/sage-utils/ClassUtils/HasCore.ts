import type { Optional } from "..";
import { SuperClass } from "./SuperClass";

//#region types

/** The most basic Core used. */
export interface Core<ObjectType extends string = string> {
	/** The type of data that is represented. Often the Class that the Core is for. */
	objectType: ObjectType;
}

//#endregion

//#region helpers

export function toJSON<
		TypedCore extends Core<ObjectType>,
		ObjectType extends string = string,
		Object extends HasCore<TypedCore> = HasCore<TypedCore>,
		ObjectOrCore extends TypedCore | Object = TypedCore | Object
		>(objectOrCore: ObjectOrCore): TypedCore {
	return "toJSON" in objectOrCore ? objectOrCore.toJSON() : objectOrCore as TypedCore;
}

//#endregion

/** Abstract Class with properties and methods related to the Core or objectType */
export abstract class HasCore<
		TypedCore extends Core<ObjectType>,
		ObjectType extends string = string
		> extends SuperClass {

	/** Must have a core. */
	public constructor(protected core: TypedCore) {
		super();
	}

	//protected setOrDelete<U extends keyof T, V extends typeof this.core[U]>(key: U, value: Optional<V>): void {
	/** Sets the core's value, or deletes the key from the core if null or undefined. */
	protected setOrDelete<Key extends keyof TypedCore, Value>(key: Key, value: Optional<Value>): void {
		if (value === null || value === undefined) {
			delete this.core[key];
		}else {
			this.core[key] = value as any;
		}
	}

	/** The type of data that is represented. Often the Class that the Core is for. */
	public get objectType(): ObjectType {
		return this.core.objectType;
	}

	/** Returns true if the given object is this object's core. */
	public is(core: TypedCore): boolean;

	/** Returns true if the given object is this object. */
	public is(hasCore: HasCore<TypedCore, ObjectType>): boolean;

	public is(value: TypedCore | HasCore<TypedCore, ObjectType>): boolean {
		if (!value) {
			return false;
		}
		return value === this
			|| value === this.core
			|| (value as HasCore<TypedCore, ObjectType>).core === this.core;
	}

	/** Returns this object's core. */
	public toJSON(): TypedCore {
		return this.core;
	}

}
