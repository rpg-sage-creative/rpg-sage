import { tagFailure } from "../index.js";

type AssertValidKeysArgs<Core> = {
	core: Core;
	objectType: string;
	validKeys: (keyof Core)[];
};
export function assertValidKeys<Core>(args: AssertValidKeysArgs<Core>): boolean {
	const { core, validKeys, objectType } = args;

	const coreKeys = Object.keys(core as object) as (keyof Core)[];
	const invalidKeys = coreKeys.filter(key => !validKeys.includes(key));
	if (invalidKeys.length) {
		return tagFailure`${objectType}: invalid keys (${invalidKeys})`;
	}

	return true;
}