import { doComplex, hasComplex } from "./internal/doComplex.js";
import { doSimple, hasSimple } from "./internal/doSimple.js";

type Options = {
	/** include the case insensitive flag in the regex */
	iFlag?: "i" | "";

	/** are spoilers allowed or optional */
	spoilers?: "optional";
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