import { parseScriptedNumber } from "../internal/parseScriptedNumber.js";
import { getSuperscriptCharacters } from "./getSuperscriptCharacters.js";

/** Converts a number using superscript characters to a numeric, "¹²³" becomes 123. */
export function parseSuperscript(value: string): number | bigint {
	return parseScriptedNumber(value, getSuperscriptCharacters())?.numericValue ?? NaN;
}