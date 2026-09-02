import { tagFailure } from "../index.js";
import type { AssertArgs } from "./types.js";

export function assertBoolean<Core>(args: AssertArgs<Core>): boolean {
	const { core, key, objectType, optional } = args;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (typeof(value) !== "boolean") return tagFailure`${objectType}: invalid boolean (${key} === ${value})`;

	}else if (!optional) {
		return tagFailure`${objectType}: missing required boolean (${key})`;
	}

	return true;
}