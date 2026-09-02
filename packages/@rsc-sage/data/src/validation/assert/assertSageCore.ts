import { errorReturnFalse, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../types/index.js";
import { assertIds, assertNumber, assertObjectType, assertSimpleObject, assertValidKeys, optional } from "./index.js";

export function assertSageCore<
			TypedCore extends SageCore<ObjectType, IdType> & { objectType:ObjectType; },
			ObjectType extends string = string,
			IdType extends Snowflake | UUID = Snowflake | UUID,
			Key extends keyof TypedCore = keyof TypedCore
		>(core: unknown, objectType: ObjectType, validKeys: Key[], id?: "snowflake" | "uuid"): core is TypedCore {

	// make sure it is a simple object: {}
	if (!assertSimpleObject<TypedCore>(core)) return false;

	// validate objectType
	if (!assertObjectType({ core, objectType })) return false;

	// validate keys
	if (!assertValidKeys({ core, objectType, validKeys })) return errorReturnFalse(core);

	// if did/id/uuid are valid keys, then validate them
	// if (validKeys.includes("did" as Key) && validKeys.includes("id" as Key) && validKeys.includes("uuid" as Key)) {
	if (validKeys.includes("id" as Key)) {
		if (!assertIds({ core, id, objectType })) return false;
	}

	if (!assertNumber({ core, objectType, key:"createdTs", optional })) return false;

	if (!assertNumber({ core, objectType, key:"updatedTs", optional })) return false;

	return true;
}