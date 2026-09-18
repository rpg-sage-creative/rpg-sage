import { getSubscriptCharSet } from "../characters/getSubscriptCharSet.js";
import { toScriptedNumber } from "./internal/toScriptedNumber.js";

/** Converts the given number to a string of subscript numbers. Ex: 123 becomes "₁₂₃" */
export function toSubscript(value: number | bigint): string {
	return toScriptedNumber(value, getSubscriptCharSet());
}
