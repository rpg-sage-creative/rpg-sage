import type { Optional } from "../types/generics.js";
import { isFiniteNumber } from "../types/index.js";
import { getNumberRegex } from "./getNumberRegex.js";

/** Returns the value cast as a number or undefined if the value does not represent a number. */
export function numberOrUndefined(value: Optional<number | string>): number | undefined {
	if (value === null || value === undefined) return undefined;
	if (isFiniteNumber(value)) return value;
	if (getNumberRegex({ anchored:true }).test(value)) return +value;
	return undefined;
}