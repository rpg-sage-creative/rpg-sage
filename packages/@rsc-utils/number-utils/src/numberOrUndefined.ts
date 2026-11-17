import { isFiniteNumber, isNumberString } from "@rsc-utils/type-utils";

/** Returns the value cast as a number or undefined if the value does not represent a number. */
export function numberOrUndefined(value: unknown): number | undefined {
	if (isFiniteNumber(value)) return value;
	if (isNumberString(value)) return +value;
	return undefined;
}