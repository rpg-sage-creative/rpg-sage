import { hasComplex } from "./internal/doComplex.js";
import { hasSimple } from "./internal/doSimple.js";

/** Checks to see if the value it matches any of the "doMath" functions. */
export function hasMath(value: string): boolean {
	return hasComplex(value)
		|| hasSimple(value)
		;
}
