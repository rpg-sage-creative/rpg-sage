import { tagFailure } from "../utils/index.js";

export function assertObjectType<TypedCore extends Core & { objectType:ObjectType; }, Core extends Record<string, any> = Record<string, any>, ObjectType extends string = string>(core: Core, objectType: ObjectType): core is TypedCore {
	if (core?.objectType !== objectType)
		return tagFailure`invalid core.objectType (${core?.objectType}): should be ${objectType}`;
	return true;
}