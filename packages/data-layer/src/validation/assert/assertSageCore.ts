import type { Snowflake, UUID } from "@rsc-utils/core-utils";
import type { SageCore } from "../../types/index.js";
import { assertIds, assertObjectType, assertSimpleObject, assertValidKeys } from "./index.js";

export function assertSageCore<
			Core extends SageCore<ObjectType, IdType>,
			ObjectType extends string = string,
			IdType extends Snowflake | UUID = Snowflake | UUID,
			Key extends keyof Core = keyof Core
		>(core: unknown, objectType: ObjectType, validKeys: Key[], id?: "snowflake" | "uuid"): core is Core {

	// make sure it is a simple object: {}
	if (!assertSimpleObject(core)) return false;

	// validate objectType
	if (!assertObjectType<Core>(core, objectType)) return false;

	// validate keys
	if (!assertValidKeys<Core>({ core, objectType, validKeys })) return false;

	// if did/id/uuid are valid keys, then validate them
	if (validKeys.includes("did" as Key) && validKeys.includes("id" as Key) && validKeys.includes("uuid" as Key)) {
		if (!assertIds({ core, id, objectType })) return false;
	}

	return true;
}