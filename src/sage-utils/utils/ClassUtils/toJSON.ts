import type { Core, HasCore } from "./HasCore";

/**
 * If the object has "toJSON", the results of calling it are returned.
 * Otherwise, the given object is returned.
 */
export function toJSON<
		TypedCore extends Core<ObjectType>,
		ObjectType extends string = string,
		Object extends HasCore<TypedCore> = HasCore<TypedCore>,
		ObjectOrCore extends TypedCore | Object = TypedCore | Object
		>(objectOrCore: ObjectOrCore): TypedCore {
	return "toJSON" in objectOrCore ? objectOrCore.toJSON() : objectOrCore as TypedCore;
}