import { isFiniteNumber, isNumberString, type Optional } from "@rsc-utils/type-utils";

/** Returns the value cast as a number or undefined if the value does not represent a number. */
export function numberOrUndefined(value: Optional<number | string>): number | undefined {
	if (value === null || value === undefined) return undefined;
	if (isFiniteNumber(value)) return value;
	if (isNumberString(value)) return +value;
	return undefined;
}