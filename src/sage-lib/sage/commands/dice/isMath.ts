import { NumberRegExp, unwrap } from "@rsc-utils/core-utils";
import { hasMath, processMath } from "@rsc-utils/game-utils";

/**
 * Checks the value against regex to determine if it is a simple math equation.
 * @param value wrapped math (HAS BRACES)
 * @returns
 */
export function isMath(value: string): boolean {
	const unwrapped = unwrap(value, "[]");
	return hasMath(unwrapped)
		&& NumberRegExp.test(processMath(unwrapped).trim());
}