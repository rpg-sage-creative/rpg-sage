import { getSubscriptCharSet } from "./getSubscriptCharSet.js";
import { toScriptedNumber } from "./toScriptedNumber.js";

/** Converts the given number to a string of subscript numbers. Ex: 123 becomes "₁₂₃" */
export function toSubscript(value: number | bigint): string {
	return toScriptedNumber(value, getSubscriptCharSet());
}
