import { parseScriptedNumber } from "../internal/parseScriptedNumber.js";
import { getSubscriptCharacters } from "./getSubscriptCharacters.js";

/** Converts a number using superscript characters to a numeric, "₁₂₃" becomes 123. */
export function parseSubscript(value: string): number | bigint {
	return parseScriptedNumber(value, getSubscriptCharacters())?.numericValue ?? NaN;
}