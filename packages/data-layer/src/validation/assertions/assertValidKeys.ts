import { tagFailure } from "../utils/index.js";

type Info<Core> = {
	core: Core;
	objectType: string;
	validKeys: (keyof Core)[];
};
export function assertValidKeys<Core>(info: Info<Core>): boolean {
	const { core, validKeys, objectType } = info;

	const coreKeys = Object.keys(core as object) as (keyof Core)[];
	const invalidKeys = coreKeys.filter(key => !validKeys.includes(key));
	if (invalidKeys.length) {
		return tagFailure`${objectType}: invalid keys (${invalidKeys})`;
	}

	return true;
}