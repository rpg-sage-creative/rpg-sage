import { debug } from "@rsc-utils/core-utils";
import { tagFailure } from "../index.js";

type Info<Core, Type> = {
	asserter?: never;
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator: (value: Type) => unknown
} | {
	asserter: (arg: { core:Type, objectType:string; }) => boolean;
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator?: never;
};

function simplifyArray(key: any, value: any[]): any[] {
	if (["playerCharacters","nonPlayerCharacters"].includes(key)) {
		return [`${value.length} ${key}`];
	}
	return value;
}

export function assertArray<Core, Type>(info: Info<Core, Type>): boolean {
	const { asserter, core, key, objectType, optional, validator } = info;

	if (key in (core as Record<string, any>)) {
		const value = core[key];
		if (!Array.isArray(value)) {
			return tagFailure`${objectType}: invalid array (${key} === ${value})`;
		}
		if (asserter) {
			const failed = value.find(val => !asserter({ core:val, objectType }));
			if (failed) {
				return tagFailure`${objectType}: invalid array item(s) asserter:${asserter.name} (${key} === ${simplifyArray(key, value)})`;
			}
		}else {
			const failed = value.find(val => !validator(val));
			if (failed) {
				if (validator.name === "assertSageCharacterCore") debug(failed);
				return tagFailure`${objectType}: invalid array item(s) validator:${validator.name} (${key} === ${simplifyArray(key, value)})`;
			}
		}

	}else if (!optional) {
		return tagFailure`${objectType}: missing required array (${key})`;
	}

	return true;
}