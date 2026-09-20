import { HasCache } from "../cache/HasCache.js";

/** The most basic Core used. */
export type Core<ObjectType extends string = string> = {
	/** The type of data that is represented. Often the Class that the Core is for. */
	objectType: ObjectType;
};

/** Abstract Class with properties and methods related to the Core or objectType */
export abstract class HasCore<
			TypedCore extends Core<ObjectType>,
			ObjectType extends string = string
		>
		extends HasCache {

	/** Must have a core. */
	public constructor(protected core: TypedCore) {
		super();
	}

	public [Symbol.toStringTag](): ObjectType {
		return this.core.objectType;
	}

	/** The type of data that is represented. Often the Class that the Core is for. */
	public get objectType(): ObjectType {
		return this.core.objectType;
	}

	/** Returns true if the given object is this object or this object's core. */
	public is(value: TypedCore | HasCore<TypedCore, ObjectType>): boolean {
		if (value && this.core) {
			if (value === this || value === this.core) {
				return true;
			}
			if ("core" in value && this.core === value.core) {
				return true;
			}
		}
		return false;
	}

	// /** Returns true if the this object's objectType matches the given value (if given a string) or its objectType (if given a HasCore). */
	// public isType(value: TypedCore | HasCore<TypedCore, ObjectType> | string): boolean {
	// 	if (typeof(value) === "string") {
	// 		return this.objectType === value;
	// 	}
	// 	return this.objectType === value.objectType;
	// }

	/** Returns this object's core. */
	public toJSON(): TypedCore {
		return this.core;
	}

	public static toJSON<
			TypedCore extends Core<ObjectType>,
			ObjectType extends string = string,
			TypedObject extends HasCore<TypedCore> = HasCore<TypedCore>,
			TypedObjectOrCore extends TypedCore | TypedObject = TypedCore | TypedObject
			>(objectOrCore: TypedObjectOrCore): TypedCore {
		return (objectOrCore as TypedObject)?.toJSON?.() ?? objectOrCore as TypedCore;
	}
}
