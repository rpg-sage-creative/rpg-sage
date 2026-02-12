import { doComplex } from "./internal/doComplex.js";
import { doSimple } from "./internal/doSimple.js";

/** Processes the value against the "doMath" functions until none are found. */
export function processMath(value: string): string {
	value = doComplex(value);
	value = doSimple(value);
	return value;
}