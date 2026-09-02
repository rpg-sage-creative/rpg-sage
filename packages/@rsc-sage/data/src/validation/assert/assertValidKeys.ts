import { tagFailure } from "../index.js";

type AssertValidKeysArgs<Core extends Record<string, any>> = {
	core: Core;
	objectType: string;
	requiredKeys?: (keyof Core)[];
	validKeys: (keyof Core)[];
};
export function assertValidKeys<Core extends Record<string, any>>(args: AssertValidKeysArgs<Core>): boolean {
	const { core, objectType, requiredKeys, validKeys } = args;

	const coreKeys = Object.keys(core as object) as (keyof Core)[];

	const invalidKeys = coreKeys.filter(key => !validKeys.includes(key));
	if (invalidKeys.length) {
		return tagFailure`${objectType}: invalid keys (${invalidKeys})`;
	}

	const missingKeys = requiredKeys?.filter(key => !(key in core));
	if (missingKeys?.length) {
		return tagFailure`${objectType}: missing keys (${missingKeys})`;
	}

	return true;
}