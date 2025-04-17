import type { Optional } from "../../types/generics.js";
import { getQuotePairs, type QuoteStyle } from "./getQuotePairs.js";

export function isEmptyQuotes(value: Optional<string>, style?: QuoteStyle): value is string {
	return getQuotePairs(style).some(pair => pair.chars === value);
}