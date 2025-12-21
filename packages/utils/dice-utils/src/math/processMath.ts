import { doComplex, hasComplex } from "./doComplex.js";
import { doSimple, hasSimple } from "./doSimple.js";

/** Checks to see if the value it matches any of the "doMath" functions. */
export function hasMath(value: string): boolean {
	return hasComplex(value)
		|| hasSimple(value)
		;
}

/** Processes the value against the "doMath" functions until none are found. */
export function processMath(value: string): string {
	value = doComplex(value);
	value = doSimple(value);
	return value;
}