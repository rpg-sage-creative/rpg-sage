import { deleteEmptyArray } from "../utils/deleteEmptyArray.js";

type EnsureTypedArrayArgs<Core, Key, Value> = {
	core: Core;
	key: Key;
	typeGuard: (object: unknown) => object is Value;
	optional?: "optional";
};

export function ensureTypedArray<
			Core extends Partial<Record<Key, Value[]>>,
			Key extends Exclude<keyof Core, "ver">,
			Value
		>({ core, key, typeGuard, optional }: EnsureTypedArrayArgs<Core, Key, Value>): void {

	// remove non-array
	if (core[key] && !Array.isArray(core[key])) {
		delete core[key];
	}

	// filter array
	core[key] = core[key]?.filter(typeGuard) ?? [] as any;

	// remove optional empty array
	if (optional === "optional") {
		deleteEmptyArray({ core, key });
	}
}