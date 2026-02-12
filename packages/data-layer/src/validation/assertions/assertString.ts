import { tagFailure } from "../utils/index.js";

type Info<Core> = {
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator?: (string: string) => unknown
};

export function assertString<Core>(info: Info<Core>): boolean {
	const { core, key, objectType, optional, validator } = info;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (typeof(value) !== "string") return tagFailure`${objectType}: invalid string (${String(key)} === ${value})`;
		if (validator && !validator(value)) return tagFailure`${objectType}: failed ${validator.name} (${key} === ${value})`;

	}else if (!optional) {
		return tagFailure`${objectType}: missing required string (${key})`;
	}

	return true;
}