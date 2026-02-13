import { tagFailure } from "../index.js";

type Info<Core, Type> = {
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator: (value: Type) => unknown
};

function simplifyArray(key: any, value: any[]): any[] {
	if (["playerCharacters","nonPlayerCharacters"].includes(key)) {
		return [`${value.length} ${key}`];
	}
	return value;
}

export function assertArray<Core, Type>(info: Info<Core, Type>): boolean {
	const { core, key, objectType, optional, validator } = info;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (!Array.isArray(value)) return tagFailure`${objectType}: invalid array (${key} === ${value})`;
		if (!value.every(validator)) return tagFailure`${objectType}: invalid array item(s) ${validator.name} (${key} === ${simplifyArray(key, value)})`;

	}else if (!optional) {
		return tagFailure`${objectType}: missing required array (${key})`;
	}

	return true;
}