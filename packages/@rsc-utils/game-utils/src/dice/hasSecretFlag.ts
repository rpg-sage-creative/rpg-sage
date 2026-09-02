import type { Optional } from "@rsc-utils/core-utils";

const SecretRegExp = /\bsecret\b/i;

/** Does the given description include the flag that indicates a secret roll. */
export function hasSecretFlag(desc?: Optional<string>): desc is string {
	return desc ? SecretRegExp.test(desc) : false;
}