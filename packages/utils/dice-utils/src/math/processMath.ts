import { doComplex, hasComplex } from "./doComplex.js";
import { doSimple, hasSimple } from "./doSimple.js";

type Options = {
	allowSpoilers?: boolean;
};

/** Checks to see if the value it matches any of the "doMath" functions. */
export function hasMath(value: string, options?: Options): boolean {
	return hasComplex(value, options)
		|| hasSimple(value, options)
		;
}

/** Processes the value against the "doMath" functions until none are found. */
export function processMath(value: string, options?: Options): string {
	value = doComplex(value, options);
	value = doSimple(value, options);
	return value;
}