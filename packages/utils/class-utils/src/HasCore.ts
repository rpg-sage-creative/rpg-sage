import { HasCache } from "@rsc-utils/cache-utils";

//#region types

/** The most basic Core used. */
export type Core<ObjectType extends string = string> = {
	/** The type of data that is represented. Often the Class that the Core is for. */
	objectType: ObjectType;
};

//#endregion

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

	/** The type of data that is represented. Often the Class that the Core is for. */
	public get objectType(): ObjectType {
		return this.core.objectType;
	}

	/** Returns true if the given object is this object or this object's core. */
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

	public static toJSON<
			TypedCore extends Core<ObjectType>,
			ObjectType extends string = string,
			TypedObject extends HasCore<TypedCore> = HasCore<TypedCore>,
			TypedObjectOrCore extends TypedCore | TypedObject = TypedCore | TypedObject
			>(objectOrCore: TypedObjectOrCore): TypedCore {
		return (objectOrCore as TypedObject)?.toJSON?.() ?? objectOrCore as TypedCore;
	}
}
