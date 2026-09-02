import { tagFailure } from "../index.js";

export function assertObjectType<
			Core extends Record<string, any> = Record<string, any>,
			ObjectType extends string = string
		>({ core, objectType }: { core:Core; objectType:ObjectType; }): boolean {
	if (core?.objectType !== objectType)
		return tagFailure`invalid core.objectType (${core?.objectType}): should be ${objectType}`;
	return true;
}