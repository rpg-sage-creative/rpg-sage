import { isNumberString, unwrap } from "@rsc-utils/core-utils";
import { hasMath } from "./hasMath.js";
import { processMath } from "./processMath.js";

/**
 * Checks the value against regex to determine if it is a simple math equation.
 * @param value wrapped math (HAS BRACES)
 * @returns
 */
export function isMath(value: string): boolean {
	const unwrapped = unwrap(value, "[]");
	if (hasMath(unwrapped)) {
		const processed = processMath(unwrapped).trim();
		return isNumberString(processed);
	}
	return false;
}