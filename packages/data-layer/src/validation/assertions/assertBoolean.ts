import { tagFailure } from "../utils/index.js";

type Info<Core> = {
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
};

export function assertBoolean<Core>(info: Info<Core>): boolean {
	const { core, key, objectType, optional } = info;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (typeof(value) !== "boolean") return tagFailure`${objectType}: invalid boolean (${key} === ${value})`;

	}else if (!optional) {
		return tagFailure`${objectType}: missing required boolean (${key})`;
	}

	return true;
}