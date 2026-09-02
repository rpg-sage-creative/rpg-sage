import { isSimpleObject } from "@rsc-utils/core-utils";
import { tagFailure } from "../index.js";
import type { AssertArgs } from "./types.js";

export function assertObject<Core>(args: AssertArgs<Core>): boolean {
	const { core, key, objectType, optional, validator } = args;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (!isSimpleObject(value)) return tagFailure`${objectType}: invalid object (${String(key)} === ${value})`;
		if (validator && !validator(value)) return tagFailure`${objectType}: failed ${validator.name} (${key} === ${value})`;

	}else if (!optional) {
		return tagFailure`${objectType}: missing required object (${key})`;
	}

	return true;
}