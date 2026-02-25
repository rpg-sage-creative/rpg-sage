import type { HasVer } from "../../types/index.js";
import { deleteEmptyArray } from "../utils/deleteEmptyArray.js";

type EnsureArrayTypeGuard<Value> = (object: unknown) => object is Value;

type EnsureTypedArrayArgs<Core, Key, TypeGuard> = {
	core: Core;
	key: Key;
	typeGuard: TypeGuard;
	optional?: "optional";
};

export function ensureTypedArray<
			Core extends HasVer & Partial<Record<Key, Value[]>>,
			Key extends Exclude<keyof Core, "ver">,
			Value
		>(args: EnsureTypedArrayArgs<Core, Key, EnsureArrayTypeGuard<Value>>): void {

	const { core, key, typeGuard, optional } = args;
	core[key] = core[key]?.filter(typeGuard) as any;
	if (optional === "optional") {
		deleteEmptyArray({ core, key });
	}
}