import { tagFailure } from "../index.js";
import type { AssertArgs } from "./types.js";

export function assertString<Core>(args: AssertArgs<Core>): boolean {
	const { core, key, objectType, optional, validator } = args;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (typeof(value) !== "string") return tagFailure`${objectType}: invalid string (${String(key)} === ${value})`;
		if (validator && !validator(value)) return tagFailure`${objectType}: failed ${validator.name} (${key} === ${value})`;

	}else if (!optional) {
		return tagFailure`${objectType}: missing required string (${key})`;
	}

	return true;
}