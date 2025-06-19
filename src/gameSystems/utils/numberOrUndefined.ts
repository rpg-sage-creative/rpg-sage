import { getNumberRegex, type Optional } from "@rsc-utils/core-utils";

/** @deprecated update core-utils and use it from there */
export function numberOrUndefined(value: Optional<string>): number | undefined {
	if (value === null || value === undefined) return undefined;
	if (getNumberRegex({ anchored:true }).test(value)) return +value;
	return undefined;
}