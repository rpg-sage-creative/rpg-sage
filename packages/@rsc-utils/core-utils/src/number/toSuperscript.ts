import { getSuperscriptCharSet } from "../characters/getSuperscriptCharSet.js";
import { toScriptedNumber } from "./internal/toScriptedNumber.js";

/** Converts the given number to a string of superscript numbers. Ex: 123 becomes "¹²³" */
export function toSuperscript(value: number | bigint): string {
	return toScriptedNumber(value, getSuperscriptCharSet());
}