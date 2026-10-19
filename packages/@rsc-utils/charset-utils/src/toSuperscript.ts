import { getSuperscriptCharSet } from "./getSuperscriptCharSet.js";
import { toScriptedNumber } from "./toScriptedNumber.js";

/** Converts the given number to a string of superscript numbers. Ex: 123 becomes "¹²³" */
export function toSuperscript(value: number | bigint): string {
	return toScriptedNumber(value, getSuperscriptCharSet());
}