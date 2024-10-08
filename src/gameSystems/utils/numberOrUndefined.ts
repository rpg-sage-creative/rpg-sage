import type { Optional } from "@rsc-utils/core-utils";
import { getNumberRegex } from "@rsc-utils/dice-utils";

export function numberOrUndefined(value: Optional<string>): number | undefined {
	if (value === null || value === undefined) return undefined;
	if (getNumberRegex({ anchored:true }).test(value)) return +value;
	return undefined;
}