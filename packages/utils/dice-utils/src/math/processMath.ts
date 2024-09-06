import { doMathFunctions, hasMathFunctions } from "./doMathFunctions.js";
import { doSimple, isSimple } from "./doSimple.js";

/** Checks to see if the value it matches any of the "doMath" functions. */
export function hasMath(value: string): boolean {
	return hasMathFunctions(value)
		|| isSimple(value)
		;
}

/** Processes the value against the "doMath" functions until none are found. */
export function processMath(value: string): string {
	if (hasMathFunctions(value)) {
		value = doMathFunctions(value);
	}
	return doSimple(value) ?? value;
}