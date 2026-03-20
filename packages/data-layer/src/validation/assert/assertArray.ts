import { debug } from "@rsc-utils/core-utils";
import { tagFailure } from "../index.js";
import type { AssertArgs } from "./types.js";

function simplifyArray(key: any, array: any[]): any[] {
	if (["playerCharacters","nonPlayerCharacters"].includes(key)) {
		return [`${array.length} ${key}`];
	}
	return array;
}

type AssertArrayArgs<Core, Type> = AssertArgs<Core, Type> & {
	uniqueByKey?: keyof Core;
};

export function assertArray<Core, Type>(args: AssertArrayArgs<Core, Type>): boolean {
	const { asserter, core, key, objectType, optional, uniqueByKey, validator } = args;

	if (key in (core as Record<string, any>)) {
		const array = core[key];
		if (!Array.isArray(array)) {
			return tagFailure`${objectType}: invalid array (${key} === ${array})`;
		}
		if (asserter) {
			const failed = array.find(val => !asserter({ core:val, objectType }));
			if (failed) {
				return tagFailure`${objectType}: invalid array item(s) asserter:${asserter.name} (${key} === ${simplifyArray(key, array)})`;
			}
		}else if (validator) {
			const failed = array.find(val => !validator(val));
			if (failed) {
				if (validator.name === "assertSageCharacterCore") debug(failed);
				return tagFailure`${objectType}: invalid array item(s) validator:${validator.name} (${key} === ${simplifyArray(key, array)})`;
			}
		}else {
			throw new Error("assertArray(args); args missing asserter AND validator");
		}
		if (uniqueByKey) {
			const dupeValues = array.filter((o, i, a) => i !== a.findIndex(other => o[uniqueByKey] === other[uniqueByKey]));
			if (dupeValues.length) {
				return tagFailure`${objectType}: duplicate array (${key}) items (${dupeValues.map(object => object[uniqueByKey])})`;
			}
		}

	}else if (!optional) {
		return tagFailure`${objectType}: missing required array (${key})`;
	}

	return true;
}
