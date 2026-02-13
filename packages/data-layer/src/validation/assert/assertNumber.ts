import type { EnumLike } from "@rsc-utils/core-utils";
import { tagFailure } from "../index.js";

type Info<Core, K extends string, V extends number> = {
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator?: EnumLike<K, V> | ((number: number) => unknown);
};

export function assertNumber<Core, K extends string, V extends number>(info: Info<Core, K, V>): boolean {
	const { core, key, objectType, optional, validator } = info;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (typeof(value) !== "number") return tagFailure`${objectType}: invalid number (${key} === ${value})`;
		if (validator) {
			if (typeof(validator) === "function") {
				if (!validator(value)) return tagFailure`${objectType}: failed ${validator.name} (${key} === ${value})`;

			}else if (!(value in validator)) {
				return tagFailure`${objectType}: invalid enum (${key} === ${value})`;
			}
		}

	}else if (!optional) {
		return tagFailure`${objectType}: missing required number (${key})`;
	}

	return true;
}